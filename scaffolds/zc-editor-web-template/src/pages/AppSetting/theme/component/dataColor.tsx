import {uuid} from 'amis-core'

export const defaultColors = [
  {
    label: '默认',
    colors: [
      '#2468f2',
      '#aa24ed',
      '#e32262',
      '#855f14',
      '#3b8714',
      '#158a63',
      '#1c77b8'
    ],
    token: "dataColor1"
  },
  {
    label: '经典',
    colors: [
      '#2468f2',
      '#c01fcf',
      '#cc3b1f',
      '#4f7a12',
      '#158f48',
      '#1c77b8',
      '#8437f0'
    ],
    token: "dataColor2"
  },
  {
    label: '过渡',
    colors: [
      '#2468f2',
      '#4856f0',
      '#6347ed',
      '#8437f0',
      '#aa24ed',
      '#c01fcf',
      '#cc1faf'
    ],
    token: "dataColor3"
  }
];

export const DataColorSchema = {
  name: 'dataColor',
  id: 'dataColor',
  asFormItem: true,
  value: defaultColors,
  component: (props: any, _: any) => {
    const {render, data, name, defaultValue, value} = props;
    const renderValue = value ? value : defaultValue;

    return render('data', {
        title: '数据色',
        type: 'fieldSet',
        collapsable: true,
        size: 'base',
        className: 'theme-fieldset',
        body: [
          {
            type: 'button',
            size: 'xs',
            level: 'link',
            className: 'generate',
            label: '新增',
            actionType: 'dialog',
            dialog: {
              title: '新增数据色',
              data: {
                dataColor: '${dataColor}'
              },
              body: {
                type: 'form',
                data: {
                  label:'',
                  colors:[]
                },
                body: [
                  {
                    type: 'input-text',
                    name: 'label',
                    required: true,
                    label: '名称'
                  },
                  {
                    type: 'combo',
                    name: 'colors',
                    label: '颜色',
                    required: true,
                    multiple: true,
                    flat: true,
                    items: [
                      {
                        name: 'text',
                        label: null,
                        required: true,
                        type: 'input-color'
                      }
                    ]
                  }
                ]
              },
              onEvent: {
                confirm: {
                  actions: [
                    {
                      actionType: 'custom',
                      script: function(_: any, doAction: any, event: any) {
                        const {colors, label} = event.data;
                        let haveNull = colors.filter((res:any) => res == '')
                        const data = [
                          ...event.data.__super.dataColor,
                          {
                            colors,
                            label,
                            custom: true,
                            token: uuid()
                          }
                        ];
                        if(colors.length > 0 && haveNull.length == 0){
                          props.onChange(data)
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          renderValue.map((item: any, index: number) => {
            return render('fieldSet', {
              title: item.label,
              type: 'fieldSet',
              collapsable: true,
              size: 'base',
              className: 'theme-fieldset',
              body: [
                {
                  type: 'button',
                  size: 'xs',
                  level: 'link',
                  className: 'generateDelete',
                  label: '删除',
                  hidden:item.label == '默认' || item.label == '经典' || item.label == '过渡',
                  actionType: "dialog",
                  dialog: {
                    title: '删除数据色',
                    body: {
                      type: 'form',
                      body: '是否确认删除当前颜色组？'
                    },
                    onEvent: {
                      confirm: {
                        actions: [
                          {
                            actionType: 'custom',
                            script: function(_: any, doAction: any, event: any) {
                              const data = event.data.dataColor.filter((res: any) =>res.label != item.label)
                              props.onChange(data)
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                {
                  type: 'button',
                  size: 'xs',
                  level: 'link',
                  className: 'generate',
                  label: '编辑',
                  actionType: "dialog",
                  dialog: {
                    title: '编辑数据色',
                    data: {
                      dataColor: '${dataColor}'
                    },
                    body: {
                      type: 'form',
                      data: `\${dataColor[${index}]}`,
                      body: [
                        {
                          type: 'input-text',
                          name: 'label',
                          required: true,
                          label: '名称'
                        },
                        {
                          type: 'combo',
                          name: 'colors',
                          label: '颜色',
                          required: true,
                          multiple: true,
                          flat: true,
                          items: [
                            {
                              name: 'text',
                              label: null,
                              required: true,
                              type: 'input-color'
                            }
                          ]
                        }
                      ]
                    },
                    onEvent: {
                      confirm: {
                        actions: [
                          {
                            actionType: 'custom',
                            script: function(_: any, doAction: any, event: any) {
                              const {colors, label} = event.data;
                              let haveNull = colors.filter((res:any) => res == '')
                              const data = [...event.data.__super.dataColor];
                              data.splice(index, 1, {
                                colors,
                                label,
                                custom: true,
                                token: uuid()
                              });
                              if(colors.length > 0 && haveNull.length == 0){
                                props.onChange(data)
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                },
                item.colors && item.colors.length >0 && item.colors.map((color: string) => {
                  return render('input-colo', {
                    type: 'static-color',
                    label: null,
                    value: color
                  });
                })
              ]
            });
          })
        ]
      }
    );
  }
};

