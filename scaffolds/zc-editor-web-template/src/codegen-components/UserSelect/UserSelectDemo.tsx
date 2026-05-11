import React from 'react';
import { Form, Button, Card, Space, message } from 'antd';
import UserSelect from './UserSelect';
import type { UserSelectOptions } from './UserSelect';

const UserSelectDemo: React.FC = () => {
  const [form] = Form.useForm();

  // 模拟数据
  const mockOptions: UserSelectOptions[] = [
  {
    "children": [
      {
        "ref": "-1",
        "children": [
          {
            "label": "供应商",
            "value": "schools"
          },
          {
            "label": "郑老师",
            "value": "zhenglaoshi"
          },
          {
            "label": "吴老师",
            "value": "wulaoshi"
          },
          {
            "label": "周老师",
            "value": "zhoulaoshi"
          },
          {
            "label": "孙老师",
            "value": "sunlaoshi"
          },
          {
            "label": "赵老师",
            "value": "zhaolaoshi"
          },
          {
            "label": "王老师",
            "value": "wanglaoshi"
          },
          {
            "label": "李老师",
            "value": "lilaoshi"
          },
          {
            "label": "钱老师",
            "value": "qianlaoshi"
          },
          {
            "label": "张老师",
            "value": "zhanglaoshi"
          },
          {
            "label": "丁一",
            "value": "dingyi"
          },
          {
            "label": "肖二",
            "value": "xiaoer"
          },
          {
            "label": "张三",
            "value": "zhangsan"
          },
          {
            "label": "李四",
            "value": "lisi"
          },
          {
            "label": "王五",
            "value": "wangwu"
          },
          {
            "label": "赵六",
            "value": "zhaoliu"
          },
          {
            "label": "李雷",
            "value": "lilei"
          },
          {
            "label": "韩梅梅",
            "value": "hanmeimei"
          },
          {
            "label": "王东",
            "value": "wangdong"
          },
          {
            "label": "程欣",
            "value": "chengxin"
          },
          {
            "label": "博文",
            "value": "bowen"
          },
          {
            "label": "子涵",
            "value": "zihan"
          },
          {
            "label": "陈三",
            "value": "chensan"
          },
          {
            "label": "sdfsd",
            "value": "sdfsdf111"
          },
          {
            "label": "dfgdf",
            "value": "dfgdfg"
          },
          {
            "label": "test1",
            "value": "test1"
          },
          {
            "label": "test2",
            "value": "test2"
          },
          {
            "label": "test3",
            "value": "test3"
          },
          {
            "label": "test4",
            "value": "test4"
          },
          {
            "label": "test6",
            "value": "test6"
          },
          {
            "label": "天津小学学生1",
            "value": "tjxxStu1"
          },
          {
            "label": "jfytest1",
            "value": "jfytest"
          },
          {
            "label": "ph",
            "value": "ph888"
          },
          {
            "label": "jfy2222",
            "value": "jfy2222"
          }
        ],
        "label": "全部部门"
      },
      {
        "ref": "tjxx_c002",
        "children": [
          {
            "label": "test4",
            "value": "test4"
          }
        ],
        "label": "教学班2"
      },
      {
        "ref": "002202501",
        "children": [
          {
            "label": "李雷",
            "value": "lilei"
          },
          {
            "label": "韩梅梅",
            "value": "hanmeimei"
          }
        ],
        "label": "2025级1班"
      },
      {
        "ref": "002202401",
        "children": [
          {
            "label": "丁一",
            "value": "dingyi"
          },
          {
            "label": "肖二",
            "value": "xiaoer"
          },
          {
            "label": "陈三",
            "value": "chensan"
          }
        ],
        "label": "2024级1班"
      },
      {
        "ref": "tjxx1",
        "children": [
          {
            "label": "天津小学学生1",
            "value": "tjxxStu1"
          },
          {
            "label": "jfy2222",
            "value": "jfy2222"
          }
        ],
        "label": "天津小学"
      },
      {
        "ref": "022202503",
        "children": [
          {
            "label": "博文",
            "value": "bowen"
          },
          {
            "label": "子涵",
            "value": "zihan"
          }
        ],
        "label": "2025级3班"
      },
      {
        "ref": "002202403",
        "children": [
          {
            "label": "王五",
            "value": "wangwu"
          },
          {
            "label": "赵六",
            "value": "zhaoliu"
          }
        ],
        "label": "2024级3班"
      },
      {
        "ref": "002202402",
        "children": [
          {
            "label": "李四",
            "value": "lisi"
          }
        ],
        "label": "2024级2班"
      },
      {
        "ref": "001",
        "children": [
          {
            "label": "供应商",
            "value": "schools"
          },
          {
            "label": "ph",
            "value": "ph888"
          },
          {
            "label": "郑老师",
            "value": "zhenglaoshi"
          },
          {
            "label": "吴老师",
            "value": "wulaoshi"
          },
          {
            "label": "周老师",
            "value": "zhoulaoshi"
          },
          {
            "label": "孙老师",
            "value": "sunlaoshi"
          },
          {
            "label": "赵老师",
            "value": "zhaolaoshi"
          },
          {
            "label": "王老师",
            "value": "wanglaoshi"
          },
          {
            "label": "李老师",
            "value": "lilaoshi"
          },
          {
            "label": "钱老师",
            "value": "qianlaoshi"
          },
          {
            "label": "张老师",
            "value": "zhanglaoshi"
          },
          {
            "label": "sdfsd",
            "value": "sdfsdf111"
          },
          {
            "label": "dfgdf",
            "value": "dfgdfg"
          },
          {
            "label": "jfytest1",
            "value": "jfytest"
          },
          {
            "label": "丁一",
            "value": "dingyi"
          },
          {
            "label": "肖二",
            "value": "xiaoer"
          },
          {
            "label": "陈三",
            "value": "chensan"
          },
          {
            "label": "李四",
            "value": "lisi"
          },
          {
            "label": "王五",
            "value": "wangwu"
          },
          {
            "label": "赵六",
            "value": "zhaoliu"
          },
          {
            "label": "李雷",
            "value": "lilei"
          },
          {
            "label": "韩梅梅",
            "value": "hanmeimei"
          },
          {
            "label": "张三",
            "value": "zhangsan"
          },
          {
            "label": "王东",
            "value": "wangdong"
          },
          {
            "label": "程欣",
            "value": "chengxin"
          },
          {
            "label": "博文",
            "value": "bowen"
          },
          {
            "label": "子涵",
            "value": "zihan"
          }
        ],
        "label": "中小学管理系统提供商"
      },
      {
        "ref": "tjxx_coo1_z001",
        "children": [
          {
            "label": "test1",
            "value": "test1"
          }
        ],
        "label": "教学班1班1小组"
      },
      {
        "ref": "001001",
        "children": [
          {
            "label": "郑老师",
            "value": "zhenglaoshi"
          },
          {
            "label": "吴老师",
            "value": "wulaoshi"
          },
          {
            "label": "周老师",
            "value": "zhoulaoshi"
          },
          {
            "label": "孙老师",
            "value": "sunlaoshi"
          },
          {
            "label": "赵老师",
            "value": "zhaolaoshi"
          },
          {
            "label": "王老师",
            "value": "wanglaoshi"
          },
          {
            "label": "李老师",
            "value": "lilaoshi"
          },
          {
            "label": "钱老师",
            "value": "qianlaoshi"
          },
          {
            "label": "张老师",
            "value": "zhanglaoshi"
          },
          {
            "label": "sdfsd",
            "value": "sdfsdf111"
          },
          {
            "label": "dfgdf",
            "value": "dfgdfg"
          },
          {
            "label": "jfytest1",
            "value": "jfytest"
          }
        ],
        "label": "教务处"
      },
      {
        "ref": "022202502",
        "children": [
          {
            "label": "张三",
            "value": "zhangsan"
          },
          {
            "label": "王东",
            "value": "wangdong"
          },
          {
            "label": "程欣",
            "value": "chengxin"
          }
        ],
        "label": "2025级2班"
      },
      {
        "ref": "tjxx_c001",
        "children": [
          {
            "label": "test2",
            "value": "test2"
          },
          {
            "label": "test3",
            "value": "test3"
          },
          {
            "label": "test6",
            "value": "test6"
          },
          {
            "label": "test1",
            "value": "test1"
          }
        ],
        "label": "教学班1"
      },
      {
        "ref": "nkxx_c003",
        "children": []
      },
      {
        "ref": "nkxx_c001",
        "children": []
      },
      {
        "ref": "nkxx_c002",
        "children": []
      },
      {
        "ref": "001002",
        "children": [
          {
            "label": "丁一",
            "value": "dingyi"
          },
          {
            "label": "肖二",
            "value": "xiaoer"
          },
          {
            "label": "陈三",
            "value": "chensan"
          },
          {
            "label": "李四",
            "value": "lisi"
          },
          {
            "label": "王五",
            "value": "wangwu"
          },
          {
            "label": "赵六",
            "value": "zhaoliu"
          },
          {
            "label": "李雷",
            "value": "lilei"
          },
          {
            "label": "韩梅梅",
            "value": "hanmeimei"
          },
          {
            "label": "张三",
            "value": "zhangsan"
          },
          {
            "label": "王东",
            "value": "wangdong"
          },
          {
            "label": "程欣",
            "value": "chengxin"
          },
          {
            "label": "博文",
            "value": "bowen"
          },
          {
            "label": "子涵",
            "value": "zihan"
          }
        ]
      },
      {
        "ref": "a",
        "children": []
      },
      {
        "ref": "a2",
        "children": []
      },
      {
        "ref": "ddd",
        "children": []
      }
    ],
    "leftOptions": [
      {
        "id": -1,
        "label": "全部部门",
        "value": "-1",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1926825649831526400",
        "label": "中小学管理系统提供商",
        "value": "001",
        "parentId": 0,
        "children": [
          {
            "id": "1926826325900804096",
            "label": "教务处",
            "value": "001001",
            "parentId": "1926825649831526400",
            "children": null
          },
          {
            "id": "1926826449167204352",
            "label": "教学班",
            "value": "001002",
            "parentId": "1926825649831526400",
            "children": [
              {
                "id": "1926826669259112448",
                "label": "2024级1班",
                "value": "002202401",
                "parentId": "1926826449167204352",
                "children": null
              },
              {
                "id": "1926826892987482112",
                "label": "2024级2班",
                "value": "002202402",
                "parentId": "1926826449167204352",
                "children": null
              },
              {
                "id": "1926827055479013376",
                "label": "2024级3班",
                "value": "002202403",
                "parentId": "1926826449167204352",
                "children": null
              },
              {
                "id": "1926827237859934208",
                "label": "2025级1班",
                "value": "002202501",
                "parentId": "1926826449167204352",
                "children": null
              },
              {
                "id": "1926827428080009216",
                "label": "2025级2班",
                "value": "022202502",
                "parentId": "1926826449167204352",
                "children": null
              },
              {
                "id": "1926827596829442048",
                "label": "2025级3班",
                "value": "022202503",
                "parentId": "1926826449167204352",
                "children": null
              }
            ]
          },
          {
            "id": "1948630196436353024",
            "label": "a",
            "value": "a",
            "parentId": "1926825649831526400",
            "children": null
          }
        ]
      },
      {
        "id": "1933734377983852544",
        "label": "天津小学",
        "value": "tjxx1",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1930204596749320192",
        "label": "实验班3班",
        "value": "nkxx_c003",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1928011755560124416",
        "label": "实验班1班",
        "value": "nkxx_c001",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1928004284024111104",
        "label": "教学班1",
        "value": "tjxx_c001",
        "parentId": 0,
        "children": [
          {
            "id": "1930544841902637056",
            "label": "教学班1班1小组",
            "value": "tjxx_coo1_z001",
            "parentId": "1928004284024111104",
            "children": null
          },
          {
            "id": "1948630274215526400",
            "label": "a",
            "value": "a2",
            "parentId": "1928004284024111104",
            "children": null
          }
        ]
      },
      {
        "id": "1928299576667783168",
        "label": "实验班2班",
        "value": "nkxx_c002",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1928004449225162752",
        "label": "教学班2",
        "value": "tjxx_c002",
        "parentId": 0,
        "children": null
      },
      {
        "id": "1948655448316735488",
        "label": "dd33",
        "value": "ddd",
        "parentId": 0,
        "children": null
      }
    ]
  }
];

  const handleSubmit = (values: any) => {
    console.log('表单提交值:', values);
    message.success(`选中的用户: ${values.user}`);
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title="UserSelect 组件演示" style={{ marginBottom: '24px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            user: 'lilei' // 默认选中李雷
          }}
        >
          <Form.Item
            label="选择用户"
            name="user"
            rules={[
              { required: true, message: '请选择用户!' }
            ]}
          >
            <UserSelect
              options={mockOptions}
              placeholder="请选择用户"
              allowClear
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="使用说明">
        <div style={{ lineHeight: '1.8' }}>
          <h4>功能特性：</h4>
          <ul>
            <li>支持在 Ant Design Form 中正常使用</li>
            <li>左侧树形选择器显示部门结构</li>
            <li>右侧列表显示对应部门的用户</li>
            <li>支持搜索功能，可直接搜索用户</li>
            <li>支持清除选择</li>
            <li>响应式设计，适配不同屏幕尺寸</li>
          </ul>
          
          <h4>使用方法：</h4>
          <ol>
            <li>点击选择框打开下拉面板</li>
            <li>在左侧树中选择部门，右侧会显示该部门的用户</li>
            <li>点击右侧用户列表中的用户进行选择</li>
            <li>或者直接在搜索框中输入用户名进行搜索选择</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default UserSelectDemo;