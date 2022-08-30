const DEMOS = [
    {
        name: 'Array/List',
        slug: 'array-list',
        schema: {
            type: 'array',
            title: 'Shopping list',
            items: {
                type: 'string'
            },
            minItems: 1,
            maxItems: 5
        },
        data: ['eggs', 'juice', 'milk']
    },

    {
        name: 'Object/Dict',
        slug: 'object-dict',
        schema: {
            type: 'object',
            keys: {
                first_name: {type: 'string'},
                last_name: {type: 'string'},
                age: {type: 'integer'},
            }
        }
    },

    {
        name: 'Additional properties',
        slug: 'additional-properties',
        schema: {
            type: 'object',
            title: 'Product attributes',
            keys: {
                brand: {type: 'string'},
                colour: {type: 'string'}
            },
            additionalProperties: {type: 'string'}
        },
        data: {
            brand: 'Nokia',
            colour: 'black',
            weight: '150 gm'
        }
    },

    {
        name: 'Enum (Choices)',
        slug: 'enum-choices',
        schema: {
            type: 'object',
            keys: {
                country: {
                    type: 'string',
                    choices: ['Australia', 'India', 'United Kingdom', 'United States']
                }
            }
        },
    },

    {
        name: 'Choices with custom labels',
        slug: 'choices-with-custom-labels',
        schema: {
            type: 'object',
            keys: {
                country: {
                    type: 'string',
                    choices: [
                        {label: '🇦🇺 Australia', value: 'au'},
                        {label: '🇮🇳 India', value: 'in'},
                        {label: '🇬🇧 United Kingdom', value: 'gb'},
                        {label: '🇺🇸 United States', value: 'us'},
                    ]
                }
            }
        }
    },

    {
        name: 'Multi select choices',
        slug: 'multi-select-choices',
        schema: {
            type: 'array',
            title: 'Cities',
            items: {
                type: 'string',
                choices: ['New york', 'London', 'Mumbai', 'Tokyo'],
                widget: 'multiselect'
            }
        },
        description: () => (
            <div>
                Multiple selections only work inside an array.<br/>
                Each selected item is added to the array in the selection order.
            </div>
        )
    },

    {
        name: 'Boolean',
        slug: 'boolean',
        schema: {
            type: 'object',
            keys: {
                isActive: {type: 'boolean', title: 'Is active'},
                isActive2: {
                    type: 'boolean',
                    title: 'Are you sure?',
                    widget: 'radio',
                    choices: [
                        {label: 'Yes', value: true},
                        {label: 'No', value: false},
                    ]
                },
                isActive3: {
                    type: 'boolean',
                    title: 'Really?',
                    widget: 'select',
                    choices: [
                        {label: 'Yes', value: true},
                        {label: 'No', value: false},
                    ]
                },
            }
        },
        description: () => (
            <div>
                Boolean fields get a radio input by default.
                But you can also use checkbox or a select input via
                the <code>widget</code> keyword.
            </div>
        )
    },

    {
        name: 'Referencing ($ref & $defs)',
        slug: 'referencing',
        schema: {
            type: 'object',
            keys: {
                name: {type: 'string'},
                shipping_address: {'$ref': '#/$defs/address'},
                billing_address: {'$ref': '#/$defs/address'},
            },
            '$defs': {
                address: {
                    type: 'object',
                    keys: {
                        house: {type: 'string'},
                        street: {type: 'string'},
                        city: {type: 'string'},
                        postal_code: {type: 'string'},
                    }
                }
            }
        }
    },

    {
        name: 'Recursion',
        slug: 'recursion',
        schema: {
            type: 'array',
            items: { 
                type: 'object',
                title: 'Person',
                keys: {
                    name: {type: 'string'},
                    age: {type: 'integer'},
                    children: {'$ref': '#'}
                }
            }
        },
        data: [{name: 'Alice', age: 90, children: []}],
        description: () => (
            <div>You can recursively nest an item within itself.
            However, there are certain edge cases where it might lead to infinite recursion error. So, be careful!
            </div>
        )
    },

    {
        name: 'File inputs',
        slug: 'file-inputs',
        schema: {
            'type': 'object',
            'properties': {
                'base64_upload': {type: 'string', 'format': 'data-url'},
                'server_upload': {type: 'string', 'format': 'file-url'},
            }
        },
        data: {},
        description: () => (
            <div>
                File upload to server (<code>file-url</code>)
                will not work in this demo because a server is required.
                However, Base64 upload (<code>data-url</code>) will work fine.
            </div>
        )
    },

    {
        name: 'Date & Time',
        slug: 'data-time',
        schema: {
            type: 'object',
            keys: {
                date: {
                    type: 'string',
                    format: 'date'
                },
                time: {
                    type: 'string',
                    format: 'time'
                },
                datetime: {
                    type: 'string',
                    format: 'date-time',
                    helpText: 'For datetime input, a custom input is used'
                }
            }
        }
    },

    {
        name: 'Textarea',
        slug: 'textarea',
        schema: {
            type: 'object',
            keys: {
                title: {type: 'string'},
                body: {type: 'string', widget: 'textarea'}
            }
        }
    },

    {
        name: 'Placeholder & Help text',
        slug: 'placehlder-help-text',
        schema: {
            type: 'object',
            keys: {
                name: {
                    type: 'string',
                    placeholder: 'Placeholder text',
                    helpText: 'This is a help text'
                }
            }
        }
    },

    {
        name: 'Readonly inputs',
        slug: 'readonly-inputs',
        schema: {
            type: 'object',
            keys: {
                name: {
                    type: 'string',
                    placeholder: 'Readonly input',
                    readonly: true
                }
            }
        }
    },

    {
        name: 'Formats',
        slug: 'formats',
        schema: {
            type: 'object',
            title: 'Available input formats',
            keys: {
                email: {type: 'string', format: 'email'},
                password: {type: 'string', format: 'password'},
                range: {type: 'string', format: 'range'},
                colour: {type: 'string', format: 'color'},
            }
        }
    }
];


export default DEMOS;
