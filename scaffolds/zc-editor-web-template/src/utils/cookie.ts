// 设置cookie
export function setCookie (c_name: string, value: any, expiremMinutes: any) {
    const exdate = new Date();
    exdate.setTime(exdate.getTime() + expiremMinutes * 60 * 1000);
    document.cookie = c_name + '=' + escape(value) + ((expiremMinutes == null) ? '' : ';expires=' + exdate.toUTCString());
  }

  // 读取cookie
  export  function getCookie (c_name: string) {
    if (document.cookie.length > 0) {
      let c_start = document.cookie.indexOf(c_name + '=');
      if (c_start != -1) {
        c_start = c_start + c_name.length + 1;
        let c_end = document.cookie.indexOf(';', c_start);
        if (c_end == -1) {c_end = document.cookie.length}
        return unescape(document.cookie.substring(c_start, c_end))
      }
    }
    return ''
  }

  // 删除cookie
  export function delCookie (c_name: string) {
    const exp = new Date();
    exp.setTime(exp.getTime() - 1);
    const cval = getCookie(c_name);
    if (cval != null) {
      document.cookie = c_name + '=' + cval + ';expires=' + exp.toUTCString();
    }
  }

  export default {
    getCookie,
    setCookie,
    delCookie,
  }
