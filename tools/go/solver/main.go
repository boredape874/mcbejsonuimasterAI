package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"sort"
)

const maxIter = 32

type Root struct {
	Size   []float64 `json:"size"`
	Anchor string    `json:"anchor"`
	Pos    []float64 `json:"pos"`
}

type Element struct {
	ID     string    `json:"id"`
	Parent string    `json:"parent"`
	Anchor string    `json:"anchor"`
	Pos    []float64 `json:"pos"`
	Size   []float64 `json:"size"`
}

type Constraint struct {
	Op    string   `json:"op"`
	IDs   []string `json:"ids"`
	Edge  string   `json:"edge"`
	A     string   `json:"a"`
	B     string   `json:"b"`
	Delta float64  `json:"delta"`
	Gap   *float64 `json:"gap"`
}

type IR struct {
	BaseResolution []float64    `json:"base_resolution"`
	Root           Root         `json:"root"`
	Elements       []Element    `json:"elements"`
	Constraints    []Constraint `json:"constraints"`
}

type Rect struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

type Result struct {
	Converged  bool                     `json:"converged"`
	Iterations int                      `json:"iterations"`
	Rects      map[string]*Rect         `json:"rects"`
	Log        []map[string]interface{} `json:"log"`
}

func jsRound(v float64) float64 {
	return math.Floor(v + 0.5)
}

func eq(a, b float64) bool {
	return jsRound(a) == jsRound(b)
}

func xMode(anchor string) string {
	switch anchor {
	case "top_right", "right_middle", "bottom_right":
		return "right"
	case "top_middle", "center", "bottom_middle":
		return "centerX"
	default:
		return "left"
	}
}

func yMode(anchor string) string {
	switch anchor {
	case "bottom_left", "bottom_middle", "bottom_right":
		return "bottom"
	case "left_middle", "center", "right_middle":
		return "centerY"
	default:
		return "top"
	}
}

func placeFrom(parent Rect, anchor string, pos []float64, size []float64) *Rect {
	w, h := size[0], size[1]
	var x float64
	switch xMode(anchor) {
	case "right":
		x = parent.X + parent.W + pos[0] - w
	case "centerX":
		x = parent.X + parent.W/2 + pos[0] - w/2
	default:
		x = parent.X + pos[0]
	}
	var y float64
	switch yMode(anchor) {
	case "bottom":
		y = parent.Y + parent.H + pos[1] - h
	case "centerY":
		y = parent.Y + parent.H/2 + pos[1] - h/2
	default:
		y = parent.Y + pos[1]
	}
	return &Rect{X: jsRound(x), Y: jsRound(y), W: w, H: h}
}

func edgeValue(r *Rect, edge string) float64 {
	switch edge {
	case "left":
		return r.X
	case "right":
		return r.X + r.W
	case "top":
		return r.Y
	case "bottom":
		return r.Y + r.H
	case "center_x":
		return r.X + r.W/2
	case "center_y":
		return r.Y + r.H/2
	default:
		panic("unknown edge " + edge)
	}
}

func setEdge(r *Rect, edge string, value float64) {
	switch edge {
	case "left":
		r.X = value
	case "right":
		r.X = value - r.W
	case "top":
		r.Y = value
	case "bottom":
		r.Y = value - r.H
	case "center_x":
		r.X = value - r.W/2
	case "center_y":
		r.Y = value - r.H/2
	default:
		panic("unknown edge " + edge)
	}
}

func parentOf(e Element) string {
	if e.Parent == "" {
		return "__root__"
	}
	return e.Parent
}

func buildParents(ir IR) map[string]string {
	parents := map[string]string{"__root__": ""}
	for _, e := range ir.Elements {
		parents[e.ID] = parentOf(e)
	}
	return parents
}

func initialRects(ir IR) (map[string]*Rect, error) {
	if len(ir.BaseResolution) != 2 {
		return nil, fmt.Errorf("base_resolution must be [w,h]")
	}
	if len(ir.Root.Size) != 2 {
		return nil, fmt.Errorf("root size must be [w,h]")
	}
	rootAnchor := ir.Root.Anchor
	if rootAnchor == "" {
		rootAnchor = "top_left"
	}
	rootPos := ir.Root.Pos
	if len(rootPos) != 2 {
		rootPos = []float64{0, 0}
	}
	screen := &Rect{X: 0, Y: 0, W: ir.BaseResolution[0], H: ir.BaseResolution[1]}
	rects := map[string]*Rect{
		"__screen__": screen,
		"__root__":   placeFrom(*screen, rootAnchor, rootPos, ir.Root.Size),
	}

	byID := map[string]Element{}
	for _, e := range ir.Elements {
		byID[e.ID] = e
	}
	visited := map[string]bool{"__screen__": true, "__root__": true}
	var visit func(string) error
	visit = func(id string) error {
		if visited[id] {
			return nil
		}
		e, ok := byID[id]
		if !ok {
			return fmt.Errorf("unknown element id %s", id)
		}
		pid := parentOf(e)
		if err := visit(pid); err != nil {
			return err
		}
		if len(e.Size) != 2 {
			return fmt.Errorf("element %q must define size as [w,h]", e.ID)
		}
		parent := rects[pid]
		rects[e.ID] = placeFrom(*parent, e.Anchor, e.Pos, e.Size)
		visited[id] = true
		return nil
	}
	for _, e := range ir.Elements {
		if err := visit(e.ID); err != nil {
			return nil, err
		}
	}
	return rects, nil
}

func logEntry(log *[]map[string]interface{}, entry map[string]interface{}) {
	*log = append(*log, entry)
}

func applyConstraint(c Constraint, rects map[string]*Rect, parents map[string]string, log *[]map[string]interface{}) bool {
	changed := false

	switch c.Op {
	case "same_size", "same_width", "same_height":
		if len(c.IDs) < 2 {
			return false
		}
		r0 := rects[c.IDs[0]]
		for _, id := range c.IDs[1:] {
			r := rects[id]
			if c.Op != "same_height" && r.W != r0.W {
				r.W = r0.W
				changed = true
			}
			if c.Op != "same_width" && r.H != r0.H {
				r.H = r0.H
				changed = true
			}
		}
		if changed {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs})
		}
		return changed

	case "align_x", "align_y":
		edge := "left"
		if c.Op == "align_x" {
			if c.Edge == "center" {
				edge = "center_x"
			} else if c.Edge == "end" {
				edge = "right"
			}
		} else {
			edge = "top"
			if c.Edge == "center" {
				edge = "center_y"
			} else if c.Edge == "end" {
				edge = "bottom"
			}
		}
		target := edgeValue(rects[c.IDs[0]], edge)
		for _, id := range c.IDs[1:] {
			r := rects[id]
			if !eq(edgeValue(r, edge), target) {
				setEdge(r, edge, target)
				changed = true
			}
		}
		if changed {
			logEntry(log, map[string]interface{}{"op": c.Op, "edge": edge, "ids": c.IDs})
		}
		return changed

	case "center_group_x", "center_group_y":
		if len(c.IDs) == 0 {
			return false
		}
		parentID := parents[c.IDs[0]]
		if parentID == "" {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs, "error": "elements have different parents"})
			return false
		}
		for _, id := range c.IDs {
			if parents[id] != parentID {
				logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs, "error": "elements have different parents"})
				return false
			}
		}
		parent := rects[parentID]
		if parent == nil {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs, "error": "unknown parent"})
			return false
		}
		if c.Op == "center_group_x" {
			left := math.Inf(1)
			right := math.Inf(-1)
			for _, id := range c.IDs {
				r := rects[id]
				left = math.Min(left, r.X)
				right = math.Max(right, r.X+r.W)
			}
			delta := jsRound((parent.X + parent.W/2) - ((left + right) / 2))
			if delta != 0 {
				for _, id := range c.IDs {
					rects[id].X += delta
				}
				changed = true
			}
		} else {
			top := math.Inf(1)
			bottom := math.Inf(-1)
			for _, id := range c.IDs {
				r := rects[id]
				top = math.Min(top, r.Y)
				bottom = math.Max(bottom, r.Y+r.H)
			}
			delta := jsRound((parent.Y + parent.H/2) - ((top + bottom) / 2))
			if delta != 0 {
				for _, id := range c.IDs {
					rects[id].Y += delta
				}
				changed = true
			}
		}
		if changed {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs})
		}
		return changed

	case "symmetric_x", "symmetric_y":
		if len(c.IDs) != 2 {
			return false
		}
		aID, bID := c.IDs[0], c.IDs[1]
		a, b := rects[aID], rects[bID]
		parentID := parents[aID]
		if parentID != parents[bID] {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs, "error": "elements have different parents"})
			return false
		}
		p := rects[parentID]
		if c.Op == "symmetric_x" {
			cx := p.X + p.W/2
			da := (a.X + a.W/2) - cx
			db := (b.X + b.W/2) - cx
			dist := (math.Abs(da) + math.Abs(db)) / 2
			aSign := 1.0
			if da <= 0 {
				aSign = -1
			}
			bSign := aSign * -1
			newACx := cx + aSign*dist
			newBCx := cx + bSign*dist
			if !eq(a.X+a.W/2, newACx) {
				a.X = jsRound(newACx - a.W/2)
				changed = true
			}
			if !eq(b.X+b.W/2, newBCx) {
				b.X = jsRound(newBCx - b.W/2)
				changed = true
			}
		} else {
			cy := p.Y + p.H/2
			da := (a.Y + a.H/2) - cy
			db := (b.Y + b.H/2) - cy
			dist := (math.Abs(da) + math.Abs(db)) / 2
			aSign := 1.0
			if da <= 0 {
				aSign = -1
			}
			bSign := aSign * -1
			newACy := cy + aSign*dist
			newBCy := cy + bSign*dist
			if !eq(a.Y+a.H/2, newACy) {
				a.Y = jsRound(newACy - a.H/2)
				changed = true
			}
			if !eq(b.Y+b.H/2, newBCy) {
				b.Y = jsRound(newBCy - b.H/2)
				changed = true
			}
		}
		if changed {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs})
		}
		return changed

	case "equal_gap_x", "equal_gap_y":
		if len(c.IDs) < 2 {
			return false
		}
		ids := append([]string{}, c.IDs...)
		sort.Slice(ids, func(i, j int) bool {
			if c.Op == "equal_gap_x" {
				return rects[ids[i]].X < rects[ids[j]].X
			}
			return rects[ids[i]].Y < rects[ids[j]].Y
		})
		gap := 0.0
		if c.Gap != nil {
			gap = *c.Gap
		} else {
			sum := 0.0
			count := 0.0
			for i := 1; i < len(ids); i++ {
				prev, cur := rects[ids[i-1]], rects[ids[i]]
				if c.Op == "equal_gap_x" {
					sum += cur.X - (prev.X + prev.W)
				} else {
					sum += cur.Y - (prev.Y + prev.H)
				}
				count++
			}
			gap = jsRound(sum / count)
		}
		cursor := 0.0
		if c.Op == "equal_gap_x" {
			cursor = rects[ids[0]].X + rects[ids[0]].W
		} else {
			cursor = rects[ids[0]].Y + rects[ids[0]].H
		}
		for i := 1; i < len(ids); i++ {
			r := rects[ids[i]]
			newPos := cursor + gap
			if c.Op == "equal_gap_x" {
				if r.X != newPos {
					r.X = newPos
					changed = true
				}
				cursor = r.X + r.W
			} else {
				if r.Y != newPos {
					r.Y = newPos
					changed = true
				}
				cursor = r.Y + r.H
			}
		}
		if changed {
			logEntry(log, map[string]interface{}{"op": c.Op, "ids": c.IDs, "gap": gap})
		}
		return changed

	case "edge_eq", "edge_offset":
		var aID, aEdge, bID, bEdge string
		aID, aEdge = splitEdge(c.A)
		bID, bEdge = splitEdge(c.B)
		target := edgeValue(rects[bID], bEdge) + c.Delta
		a := rects[aID]
		if !eq(edgeValue(a, aEdge), target) {
			setEdge(a, aEdge, target)
			changed = true
			logEntry(log, map[string]interface{}{"op": c.Op, "a": c.A, "b": c.B, "delta": c.Delta})
		}
		return changed
	}

	logEntry(log, map[string]interface{}{"op": c.Op, "error": "unknown constraint op"})
	return false
}

func splitEdge(s string) (string, string) {
	for i, ch := range s {
		if ch == '.' {
			return s[:i], s[i+1:]
		}
	}
	return s, ""
}

func solve(ir IR) (Result, error) {
	parents := buildParents(ir)
	rects, err := initialRects(ir)
	if err != nil {
		return Result{}, err
	}
	log := []map[string]interface{}{}
	iter := 0
	changed := true
	for changed && iter < maxIter {
		changed = false
		for _, c := range ir.Constraints {
			if applyConstraint(c, rects, parents, &log) {
				changed = true
			}
		}
		iter++
	}
	return Result{
		Converged:  !changed,
		Iterations: iter,
		Rects:      rects,
		Log:        log,
	}, nil
}

func main() {
	raw, err := io.ReadAll(os.Stdin)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	var ir IR
	if err := json.Unmarshal(raw, &ir); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	result, err := solve(ir)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(result); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
