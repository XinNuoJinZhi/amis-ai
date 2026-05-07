/** 表单容器 */
export interface FormSchema {
  /** 控件类型固定为 form */
  type: "form";
  /** 表单标题 */
  title?: string;
  /** 提交时调用的 API */
  api?: string;
  /** 表单项 */
  body?: any[];
  /** 提交按钮文案，默认 "提交" */
  submitText?: string;
}

export interface SelectSchema {
  type: "select";
  /** 选项可以是字符串数组、对象数组、或带分组结构 */
  options?: string[] | { label: string; value: any }[] | { label: string; children: any[] }[];
  /** 远程拉取选项的 API */
  source?: string | { url: string; method?: "get" | "post" };
}
