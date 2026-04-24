# JSON UI Examples

Find useful JSON UI snippets and resources for your Minecraft Bedrock Resource Pack. Credit goes to the person who provided the resource or me if not specified.

Content: 
- [Links](#Links)
- [Tutorials](#Tutorials)
- [Code Snippets](#Codes)
- [UI Creations/Layouts with Code](#Creations)

## Links

1. For Beginners: [https://wiki.bedrock.dev/json-ui/json-ui-intro](https://wiki.bedrock.dev/json-ui/json-ui-intro)
2. Documentation: [https://wiki.bedrock.dev/json-ui/json-ui-documentation](https://wiki.bedrock.dev/json-ui/json-ui-documentation)
3. Wiki: [https://wiki.bedrock.dev/json-ui/](https://wiki.bedrock.dev/json-ui/)
4. Chest UI Editor Tool by Minato: [https://minato-mba.github.io/web-apps/chest-ui-editor/](https://minato-mba.github.io/web-apps/chest-ui-editor/)
5. JSON UI VSCode Extension by Dingsel: [https://marketplace.visualstudio.com/items?itemName=Dingsel.bedrock-ui](https://marketplace.visualstudio.com/items?itemName=Dingsel.bedrock-ui)
6. JSON UI Tutorial Playlist I recommend: [https://www.youtube.com/watch?v=QhJkCDIZ-NU&list=PLu4XsMgGIrCqdU44JbWvgv1z_kt_ZpJyw](https://www.youtube.com/watch?v=QhJkCDIZ-NU&list=PLu4XsMgGIrCqdU44JbWvgv1z_kt_ZpJyw)
7. Valuable JSON UI Guides and Examples by Geenium: [https://web.archive.org/web/20200929035954/https://geenium.com/bedrock/json-guis/](https://web.archive.org/web/20200929035954/https://geenium.com/bedrock/json-guis/)

## Tutorials

1. [Editing Server Forms](https://www.youtube.com/watch?v=QhJkCDIZ-NU&list=PLu4XsMgGIrCqdU44JbWvgv1z_kt_ZpJyw)
2. [Creating Custom Progress Bar](https://www.youtube.com/watch?v=_J5Bi-krhw8)
3. [AgentMindStorm's UI Basics](https://www.youtube.com/watch?v=K7UyzmmML-g)
4. [Smell of Curry's Master UI Guide](https://www.youtube.com/watch?v=jNNok7N5MLY)
5. [Dakonblackrose's Settings Tab Template](https://www.youtube.com/watch?v=yO06YVyohxY)

## Codes

1. Custom Text Button and Toggle:
```json
{
  "button@common_buttons.light_text_button": {
    "$button_text": "Click",
    "$pressed_button_name": "button.id",
    "$size": [50, 25]
  },

  "toggle@common_toggles.light_text_toggle": {
    "$button_text": "Toggle",
    "$toggle_name": "toggle"
    "$toggle_view_binding_name": "panel_toggle" // control name used in bindings
    "size": [50, 25]
  }
}
```

2. [Custom Tabs (like in play screen)](https://discord.com/channels/523663022053392405/1279568076404293652/1279778678687010839)

3. 3x3 Hotbar Grid:
```json
{
  "stack_1": {
    "type": "grid",
    "grid_dimensions": [
      3,
      3
    ],
    "$hotbar_collection_name|default": "hotbar_items",
    "grid_item_template": "hud.gui_hotbar_grid_item",
    "grid_dimension_binding": "#hotbar_grid_dimensions",
    "collection_name": "$hotbar_collection_name",
    "bindings": [
      {}
    ]
  }
}
```

4. [Custom Element Factories](https://discord.com/channels/523663022053392405/868073903703093259/994365337401315498)

5. Custom Slider: [./custom_slider.json](https://github.com/LeGend077/json-ui-examples/blob/main/custom_slider.json)

6. [Draggable Element](https://discord.com/channels/494194063730278411/1129449905388269647) (Bedrock-OSS Discord Server)

7. [Determine String Length](https://discord.com/channels/494194063730278411/1164751772208865301) (Bedrock-OSS Discord Server)

8. [Simple Chunk Display](https://discord.com/channels/494194063730278411/1115457940472746014) (Bedrock-OSS Discord Server)

9. [Image/Label Cyclers](https://discord.com/channels/494194063730278411/1090928017431339071) (Image Gallery sort of)

10. [Preserve Title Text](https://wiki.bedrock.dev/json-ui/preserve-title-texts)

11. Custom Toggle (with any state texture you want): [./custom_toggle.json](https://github.com/LeGend077/json-ui-examples/blob/main/custom_toggle.json)

12. Custom Progress Bar: [./custom_progress_bar.json](https://github.com/LeGend077/json-ui-examples/blob/main/custom_progress_bar.json)

13. Text/Input Box (text binding: `#item_name`):
```json
{
  "input_box@common.text_edit_box": {
    "size": [ "100%", 28 ],
    "max_length": 99,
    // "$text_edit_box_text_type": "NumberChars", (If you want only numbers)
    "$text_edit_text_control": "input_text_control",
    "$place_holder_text": "Input here..",
    "$text_alignment": "center"
  }
}
```

14. Change Size and Offset using Bindings: [./size_offset.json](https://github.com/LeGend077/json-ui-examples/blob/main/size_offset.json)

15. Progress Icons like heart or hunger bars: [./custom_heart_or_hunger_like_progress_bar_icons.json](https://github.com/LeGend077/json-ui-examples/blob/main/custom_heart_or_hunger_like_progress_bar_icons.json)

16. Custom Title base NPC Screen Form: [./custom_npc_screen_layout_reference_file.json](https://github.com/LeGend077/json-ui-examples/blob/main/custom_npc_screen_layout_reference_file.json)

17. [Animated Toggle](https://discord.com/channels/523663022053392405/1338743808187174922/1338743808187174922)

18. [Grayscaled Image](https://discord.com/channels/523663022053392405/1223427312192716860):
```json
{
  "grayscaled_image": {
    "type": "image",
    "size": [ 16, 16 ],
    "texture": "textures/items/apple",
    "color": [0.4666, 0.4666, 0.4666]
  }
}
```

19. [Custom Crafting Table UI](https://discord.com/channels/523663022053392405/1330589149711040573/1330589149711040573)

20. Prevent Touch Icon when clicking a button on hud screen: `"prevent_touch_input": true`

21. [Search bar with Textbox](https://discord.com/channels/523663022053392405/1246801922917138512)

22. [Make Server Form unclosable](https://discord.com/channels/523663022053392405/1067870274894172260/1342318716179976253):
```json
{
    "namespace": "server_form",
    "third_party_server_screen": {
        "button_mappings": []
    },
    "long_form": {
        "$show_close_button": false
    },
    "custom_form": {
        "$show_close_button": false
    }
}
```

23. [Modify item lore/hover text (ui_common.json)](https://discord.com/channels/523663022053392405/1067870274894172260/1332401225693532261)

24. [Animated Button States](https://github.com/PixelAlphas/Collapse-UI/commit/b9811b7f20e1fe0cb4a6f8052ae5cf78569ada37):
```json
{
  "animated_states_button@common.button": {
        "size": [
            100,
            20
        ],
        "locked_control": "locked",
        "default_control": "default",
        "hover_control": "hover",
        "pressed_control": "pressed",
        "button_mappings": [
            {
                "from_button_id": "button.menu_select",
                "to_button_id": "$pressed_button_name",
                "mapping_type": "pressed"
            },
            // this allows us to use $pressed_button_name in animation_reset_name property.
            {
                "to_button_id": "$pressed_button_name",
                "mapping_type": "pressed"
            },
            {
                "from_button_id": "button.menu_ok",
                "to_button_id": "$pressed_button_name",
                "mapping_type": "focused"
            }
        ],
        "controls": [
            {
                "default": {
                    "type": "image",
                    "texture": "textures/ui/White",
                    "animation_reset_name": "$pressed_button_name",
                    "anims": [
                        {
                            "alphaIn": {
                                "anim_type": "alpha",
                                "from": 0,
                                "to": 1,
                                "duration": 0.5
                            }
                        }
                    ]
                }
            },
            {
                "hover": {
                    "type": "image",
                    "texture": "textures/ui/White",
                    "animation_reset_name": "$pressed_button_name",
                    "color": [
                        0,
                        1,
                        0
                    ],
                    "anims": [
                        {
                            "alphaIn": {
                                "anim_type": "alpha",
                                "from": 0,
                                "to": 1,
                                "duration": 0.5
                            }
                        }
                    ]
                }
            },
            {
                "pressed": {
                    "type": "image",
                    "texture": "textures/ui/White",
                    "animation_reset_name": "$pressed_button_name",
                    "anims": [
                        {
                            "alphaIn": {
                                "anim_type": "alpha",
                                "from": 0,
                                "to": 1,
                                "duration": 0.5
                            }
                        }
                    ]
                }
            },
            {
                "locked@common.empty_panel": {}
            }
        ]
    }
}
```

25. [Splitting String](https://discord.com/channels/523663022053392405/1343184050311139349)

26. [Animated Progress Bar](https://discord.com/channels/523663022053392405/1430909706251272283/1430909706251272283)

27. [Change color based on binding/score](https://discord.com/channels/523663022053392405/1067869374410657962/threads/1427455039424954429):
```json
"property_bag": {
  "#color_0": [0, 0, 0],
  "#color_1": [1, 1, 1]
},
"bindings": [
  {
    "binding_type": "view",
    "source_property_name": "('#color_' + (#score < 100) * 1)",
    "target_property_name": "#color"
  }
]
```

28. [Factory Controls IDs Working](https://discord.com/channels/523663022053392405/1067870274894172260/1473376432896999666)

## Creations

### NPC Screen with Server Form Layout

<details>
  
  <summary>luckywars_selectors.json</summary>
  
```json

  {
    "namespace": "lw:selector",
    "close_button_holder": {
        "type": "panel",
        "size": [
            "100%c",
            "100%c"
        ],
        "anchor_from": "top_right",
        "anchor_to": "bottom_right",
        "controls": [
            {
                "close@npc_interact.close_button_base": {
                    "$close_button_to_button_id": "button.exit_student",
                    "offset": [
                        -5,
                        25
                    ],
                    "$default_texture": "textures/ui/close_button_default_light",
                    "$pressed_texture": "textures/ui/close_button_hover",
                    "$hover_texture": "textures/ui/close_button_pressed",
                    "$visibility_binding_name": "#student_view_visible"
                }
            }
        ]
    },
    "divider": {
        "type": "image",
        "texture": "textures/ui/divider2",
        "size": [
            "100% - 75px",
            2
        ],
        "offset": [
            0,
            31
        ],
        "anchor_from": "top_middle"
    },
    "title_text@common_dialogs.standard_title_label": {
        "$text_name": "#title_text",
        "$title_text_binding_type": "global",
        "$title_binding_condition": "none",
        "anchor_from": "top_middle",
        "anchor_to": "top_middle",
        "font_scale_factor": 1.5,
        "size": [
            "default",
            "default"
        ],
        "color": [
            1,
            1,
            1,
            1
        ],
        "font_type": "MinecraftTen",
        "shadow": false,
        "offset": [
            0,
            8
        ]
    },
    "main_panel": {
        "type": "panel",
        "size": [
            225,
            220
        ],
        "controls": [
            {
                "close_button@lw:selector.close_button_holder": {
                }
            },
            {
                "title_text@lw:selector.title_text": {
                }
            },
            {
                "divider@lw:selector.divider": {
                }
            },
            {
                "dialog_panel": {
                    "type": "panel",
                    "size": [
                        "100%",
                        "100%"
                    ],
                    "anchor_from": "center",
                    "anchor_to": "center",
                    "controls": [
                        {
                            "dialog_border": {
                                "type": "image",
                                "size": [
                                    "100%",
                                    "100%"
                                ],
                                "layer": 1,
                                "texture": "textures/ui/dialog_background_hollow_4_thin"
                            }
                        },
                        {
                            "dialog_background": {
                                "type": "image",
                                "size": [
                                    "100% - 4px",
                                    "100% - 4px"
                                ],
                                "layer": -2,
                                "texture": "textures/ui/Black",
                                "alpha": 0.7
                            }
                        },
                        {
                            "scroll@lw:selector.dialog_content_scroll": {
                            }
                        }
                    ]
                }
            }
        ]
    },
    "dialog_content_scroll@common.scrolling_panel": {
        "anchor_to": "top_middle",
        "anchor_from": "top_middle",
        "$show_background": false,
        "size": [
            "100% - 10px",
            "100% - 29px"
        ],
        "$scrolling_content": "lw:selector.dialog_content",
        "$scroll_size": [
            5,
            "100%"
        ],
        "$scrolling_pane_size": [
            "100% - 10px",
            "100% - 29px"
        ],
        "$scrolling_pane_offset": [
            4,
            36
        ],
        "$scroll_bar_right_padding_size": [
            0,
            0
        ]
    },
    "dialog_content": {
        "type": "stack_panel",
        "orientation": "vertical",
        "size": [
            "100%",
            "100%c"
        ],
        "controls": [
            {
                "label_offset": {
                    "type": "panel",
                    "size": [
                        "100% - 2px",
                        "100%c"
                    ],
                    "controls": [
                        {
                            "npc_message@npc_interact.npc_message": {
                                "$text_box_text_color": [
                                    1,
                                    1,
                                    1,
                                    1
                                ],
                                "offset": [
                                    3,
                                    0
                                ],
                                "$color": [
                                    1,
                                    1,
                                    1,
                                    1
                                ]
                            }
                        }
                    ]
                }
            },
            {
                "buttons_grid": {
                    "type": "stack_panel",
                    "orientation": "vertical",
                    "anchor_from": "top_middle",
                    "anchor_to": "top_middle",
                    "size": [
                        "100%",
                        "100%c"
                    ],
                    "collection_name": "student_buttons_collection",
                    "controls": [
                        {
                            "0@student_button": {
                                "collection_index": 0
                            }
                        },
                        {
                            "1@student_button": {
                                "collection_index": 1
                            }
                        },
                        {
                            "2@student_button": {
                                "collection_index": 2
                            }
                        },
                        {
                            "3@student_button": {
                                "collection_index": 3
                            }
                        },
                        {
                            "4@student_button": {
                                "collection_index": 4
                            }
                        },
                        {
                            "5@student_button": {
                                "collection_index": 5
                            }
                        },
                        {
                            "6@student_button": {
                                "collection_index": 6
                            }
                        }
                    ]
                }
            }
        ]
    },
    "student_button@common.empty_panel": {
        "size": [
            "100%",
            30
        ],
        "controls": [
            {
                "button@common_buttons.light_text_button": {
                    "$button_type_panel": "npc_interact.student_button_label_panel",
                    "$pressed_button_name": "button.student_button",
                    "layer": 4,
                    "size": [
                        "100% - 4px",
                        "100% - 2px"
                    ],
                    "bindings": [
                        {
                            "binding_type": "collection_details",
                            "binding_collection_name": "student_buttons_collection",
                            "binding_collection_prefix": "student_buttons"
                        }
                    ]
                }
            }
        ],
        "bindings": [
            {
                "binding_name": "#student_button_visible",
                "binding_type": "collection",
                "binding_name_override": "#visible",
                "binding_collection_name": "student_buttons_collection"
            }
        ]
    },
    "luckywars_selector": {
        "type": "panel",
        "controls": [
            {
                "mp@lw:selector.main_panel": {
                }
            }
        ]
    }
}

```
</details>

<details>
  
  <summary>npc_interact_screen.json</summary>
  
```json
  
{
    "choose_student_panel": {
        "type": "panel",
        "controls": [
            {
                "student@common_dialogs.form_fitting_main_panel_no_buttons": {
                    "$panel_size": [
                        320,
                        "100%cm"
                    ],
                    "size": "$panel_size",
                    "$child_control": "npc_interact.student_view_content",
                    "$title_panel": "common_dialogs.standard_title_label",
                    "$text_name": "#title_text",
                    "$title_text_binding_type": "global",
                    "$show_close_button": false,
                    "$custom_background": "common_dialogs.dialog_background_opaque_with_child",
                    "bindings": [
                        {
                            "binding_type": "global",
                            "binding_name": "#title_text"
                        },
                        {
                            "binding_type": "view",
                            "source_property_name": "(((#title_text - 'MENU') = #title_text) and ((#title_text - 'GameSelector') = #title_text) and ((#title_text - 'HELP') = #title_text))",
                            "target_property_name": "#visible"
                        }
                    ]
                }
            },
            {
                "luckywars_selector@lw:selector.luckywars_selector": {
                    "bindings": [
                        {
                            "binding_type": "global",
                            "binding_name": "#title_text"
                        },
                        {
                            "binding_type": "view",
                            "source_property_name": "(not ((#title_text - 'MENU') = #title_text) or not ((#title_text - 'GameSelector') = #title_text) or not ((#title_text - 'HELP') = #title_text))",
                            "target_property_name": "#visible"
                        }
                    ]
                }
            }
        ],
        "bindings": [
            {
                "binding_name": "#student_view_visible",
                "binding_name_override": "#visible",
                "binding_type": "global"
            }
        ]
    },
    "npc_screen_contents": {
        "modifications": [
            {
                "array_name": "controls",
                "operation": "remove",
                "control_name": "student"
            },
            {
                "array_name": "controls",
                "operation": "insert_front",
                "value": [
                    {
                        "student_screen@npc_interact.choose_student_panel": {
                        }
                    }
                ]
            }
        ]
    }
}  
  
```

</details>

[![abcd](https://img.youtube.com/vi/F57yradtxH0/0.jpg)](https://www.youtube.com/watch?v=F57yradtxH0)

---

### Java like Chest UI in Server Forms

[Source Code](https://github.com/Herobrine643928/Chest-UI))

<img width="870" height="665" alt="image" src="https://github.com/user-attachments/assets/bb97e685-99f2-4718-b57a-6df4b6c64137" />

<img width="346" height="324" alt="image" src="https://github.com/user-attachments/assets/1fa683e3-9dcc-4672-afcd-4c8da78e1166" />
