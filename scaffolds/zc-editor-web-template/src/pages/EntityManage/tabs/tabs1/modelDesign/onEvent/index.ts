import { getAllSimple, getTableData, getZidian } from "@/api/entitymanage";
import { addRule } from "amis";
import {validateTimeInput} from '@/utils';

export default (usersList: any,) => {
    return {
        "click": {
            "actions": [
                {
                    "actionType": "custom",
                    script: function (_: any, doAction: any, event: any) {
                        addRule('isZXS',(values, value) => {
                                  let sameName = false
                                  let sameNames = false
                                  let sameNamess = false
                                  let sameNamesss = false
                                  let keyName = false
                                  console.log(values, '11111111111')
                                  console.log(value, '2222222222')
                                  let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                  const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                                  const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                                  if (value.toUpperCase() === 'ID' ||
                                      value.toUpperCase() === treeParentName.toUpperCase() ||
                                      value.toUpperCase() === tenantCodeName.toUpperCase() ||
                                      value.toUpperCase() === 'CREATEDAT' ||
                                      value.toUpperCase() === 'UPDATEDAT' ||
                                      value.toUpperCase() === 'CREATEDBY' ||
                                      value.toUpperCase() === 'UPDATEBY' ||
                                      value.toUpperCase() === 'DELETEDBY' ||
                                      value.toUpperCase() === 'DELETEDAT' ||
                                      value.toUpperCase() === 'DELETED'
                                  ) {
                                      sameNamesss = true
                                  }
                                  let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                                  dataArr.forEach((res: any) => {
                                      if (res.code.toUpperCase() == value.toUpperCase()) {
                                          console.log('进入')
                                          sameName = true
                                          return {
                                              error: true,
                                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                          };
                                      }
                                      // if (values.fieldType == 'date-range') {
                                      if (res.type == 'date-range') {
                                          let time = value + '_time'
                                          let stime = value + '_stime'
                                          let etime = value + '_etime'
                                          let fileTime = res.code + '_time'
                                          let fileStime = res.code + '_stime'
                                          let fileEtime = res.code + '_etime'
                                          if (res.code.toUpperCase() == time.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          }
                                      }
                                      if (values.fieldType == 'date-range') {
                                          let time = value + '_time'
                                          let stime = value + '_stime'
                                          let etime = value + '_etime'
                                          if (res.code.toUpperCase() == time.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          } else if (res.code.toUpperCase() == value.toUpperCase()) {
                                              sameNames = true
                                              return {
                                                  error: true,
                                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                              };
                                          }
                                      }
                                      // }
                                  })
                                  console.log(cacheEditLists, '添加cacheEditLists')
                                  if (cacheEditLists.length > 0) {
                                      cacheEditLists.forEach((lists: any) => {
                                          if (lists.code.toUpperCase() == value.toUpperCase()) {
                                              sameNamess = true
                                          }
                                      })
                                  }
                                  let keyArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                  if (values.unique && values.unique == true) {
                                      keyArr.forEach((element: any) => {
                                          if (element.code.toUpperCase() == values.fieldName.toUpperCase()) {
                                              keyName = true
                                          }
                                      });
                                  }
                                  if (sameName) {
                                      return {
                                          error: true,
                                          msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                      };
                                  } else if (sameNames) {
                                      return {
                                          error: true,
                                          msg: '字段名已被占用（不区分大小写），请换个名字。'
                                      };
                                  } else if (sameNamesss) {
                                      return {
                                          error: true,
                                          msg: '字段名不能和系统字段同名，请换个名字。'
                                      };
                                  } else if (sameNamess) {
                                      return {
                                          error: true,
                                          msg: '字段名被循环修改过，请换个名字。'
                                      };
                                  } else if (keyName) {
                                      return {
                                          error: true,
                                          msg: '字段名与索引列表字段名重复，请修改。'
                                      };
                                  } else {
                                      return true;
                                  }
                              });
                        addRule('tokenValidations',(values, value) => {
                          let longLength = false
                          let mastLongLength = false
                          const regex = /^.{17,}$/;
                          const mastRegex = /^.{16}$/;
                          if(regex.test(value)){
                            longLength = true
                          }
                          if(!mastRegex.test(value)){
                            mastLongLength = true
                          }
                          if (longLength) {
                            return {
                              error: true,
                              msg: '密钥字段长度不能超过16位！'
                            };
                          } else if (mastLongLength) {
                            return {
                              error: true,
                              msg: '密钥字段长度必须是16位！'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule('isTenant',(values, value) => {
                                  let sameName = false
                                  let sameNames = false
                                  let sameNamess = false
                                  let sameNamesss = false
                                  let keyName = false
                                  let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                  const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                                  if (value.toUpperCase() === 'ID' ||
                                      value.toUpperCase() === treeParentName.toUpperCase() ||
                                      value.toUpperCase() === 'CREATEDAT' ||
                                      value.toUpperCase() === 'UPDATEDAT' ||
                                      value.toUpperCase() === 'CREATEDBY' ||
                                      value.toUpperCase() === 'UPDATEBY' ||
                                      value.toUpperCase() === 'DELETEDBY' ||
                                      value.toUpperCase() === 'DELETEDAT' ||
                                      value.toUpperCase() === 'DELETED'
                                  ) {
                                      sameNamesss = true
                                  }
                                  let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                                  dataArr.forEach((res: any) => {
                                      if (res.code.toUpperCase() == value.toUpperCase()) {
                                          console.log('进入')
                                          sameName = true
                                          return {
                                              error: true,
                                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                          };
                                      }
                                  })
                                  if (cacheEditLists.length > 0) {
                                      cacheEditLists.forEach((lists: any) => {
                                          if (lists.code.toUpperCase() == value.toUpperCase()) {
                                              sameNamess = true
                                          }
                                      })
                                  }
                                  let keyArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                                  if (values.unique && values.unique == true) {
                                      keyArr.forEach((element: any) => {
                                          if (element.code.toUpperCase() == values.fieldName.toUpperCase()) {
                                              keyName = true
                                          }
                                      });
                                  }
                                  if (sameName) {
                                      return {
                                          error: true,
                                          msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                      };
                                  } else if (sameNames) {
                                      return {
                                          error: true,
                                          msg: '字段名已被占用（不区分大小写），请换个名字。'
                                      };
                                  } else if (sameNamesss) {
                                      return {
                                          error: true,
                                          msg: '字段名不能和系统字段同名，请换个名字。'
                                      };
                                  } else if (sameNamess) {
                                      return {
                                          error: true,
                                          msg: '字段名被循环修改过，请换个名字。'
                                      };
                                  } else if (keyName) {
                                      return {
                                          error: true,
                                          msg: '字段名与索引列表字段名重复，请修改。'
                                      };
                                  } else {
                                      return true;
                                  }
                              });
                        addRule('isTree',(values, value) => {
                            console.log(values,'valuesvaluesvalues')
                            console.log(value,'valuevaluevalue')
                            let sameName = false
                            let sameNames = false
                            let sameNamess = false
                            let sameNamesss = false
                            let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                            if (value.toUpperCase() === 'ID' ||
                              value.toUpperCase() === tenantCodeName.toUpperCase() ||
                              value.toUpperCase() === 'CREATEDAT' ||
                              value.toUpperCase() === 'UPDATEDAT' ||
                              value.toUpperCase() === 'CREATEDBY' ||
                              value.toUpperCase() === 'UPDATEBY' ||
                              value.toUpperCase() === 'DELETEDBY' ||
                              value.toUpperCase() === 'DELETEDAT' ||
                              value.toUpperCase() === 'DELETED'
                            ) {
                              sameNamesss = true
                            }
                            let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                            dataArr.forEach((res: any) => {
                              if (res.code.toUpperCase() == value.toUpperCase()) {
                                sameName = true
                                return {
                                  error: true,
                                  msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                            })
                            if (cacheEditLists.length > 0) {
                              cacheEditLists.forEach((lists: any) => {
                                if (lists.code.toUpperCase() == value.toUpperCase()) {
                                  sameNamess = true
                                }
                              })
                            }
                            if (sameName) {
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNames) {
                              return {
                                error: true,
                                msg: '字段名已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNamesss) {
                              return {
                                error: true,
                                msg: '字段名不能和系统字段同名，请换个名字。'
                              };
                            } else if (sameNamess) {
                              return {
                                error: true,
                                msg: '字段名被循环修改过，请换个名字。'
                              };
                            } else {
                              return true;
                            }
                          });
                        addRule('isCreatedBy',(values, value) => {
                            let sameName = false
                            let sameNames = false
                            let sameNamess = false
                            let sameNamesss = false
                            let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                            const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                            const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                            if (value.toUpperCase() === 'ID' ||
                              value.toUpperCase() === treeParentName.toUpperCase() ||
                              value.toUpperCase() === tenantCodeName.toUpperCase() ||
                              value.toUpperCase() === 'CREATEDAT' ||
                              value.toUpperCase() === 'UPDATEDAT' ||
                              value.toUpperCase() === 'UPDATEBY' ||
                              value.toUpperCase() === 'DELETEDBY' ||
                              value.toUpperCase() === 'DELETEDAT' ||
                              value.toUpperCase() === 'DELETED'
                            ) {
                              sameNamesss = true
                            }
                            let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                            dataArr.forEach((res: any) => {
                              if (res.code.toUpperCase() == value.toUpperCase()) {
                                console.log('进入')
                                sameName = true
                                return {
                                  error: true,
                                  msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                              if (res.type == 'date-range') {
                                let time = value + '_time'
                                let stime = value + '_stime'
                                let etime = value + '_etime'
                                let fileTime = res.code + '_time'
                                let fileStime = res.code + '_stime'
                                let fileEtime = res.code + '_etime'
                                if (res.code.toUpperCase() == time.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                  sameNames = true
                                  return {
                                    error: true,
                                    msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                  };
                                }
                              }
                            })
                            if (cacheEditLists.length > 0) {
                              cacheEditLists.forEach((lists: any) => {
                                if (lists.code.toUpperCase() == value.toUpperCase()) {
                                  sameNamess = true
                                }
                              })
                            }
                            if (sameName) {
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNames) {
                              return {
                                error: true,
                                msg: '字段名已被占用（不区分大小写），请换个名字。'
                              };
                            } else if (sameNamesss) {
                              return {
                                error: true,
                                msg: '字段名不能和系统字段同名，请换个名字。'
                              };
                            } else if (sameNamess) {
                              return {
                                error: true,
                                msg: '字段名被循环修改过，请换个名字。'
                              };
                            } else {
                              return true;
                            }
                          });
                        addRule('isDeletedBy',(values, value) => {
                          let sameName = false
                          let sameNames = false
                          let sameNamess = false
                          let sameNamesss = false
                          let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                          const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                          const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                          if (value.toUpperCase() === 'ID' ||
                            value.toUpperCase() === treeParentName.toUpperCase() ||
                            value.toUpperCase() === tenantCodeName.toUpperCase() ||
                            value.toUpperCase() === 'CREATEDAT' ||
                            value.toUpperCase() === 'UPDATEDAT' ||
                            value.toUpperCase() === 'CREATEDBY' ||
                            value.toUpperCase() === 'UPDATEBY' ||
                            value.toUpperCase() === 'DELETEDAT' ||
                            value.toUpperCase() === 'DELETED'
                          ) {
                            sameNamesss = true
                          }
                          let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                          dataArr.forEach((res: any) => {
                            if (res.code.toUpperCase() == value.toUpperCase()) {
                              console.log('进入')
                              sameName = true
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            }
                            if (res.type == 'date-range') {
                              let time = value + '_time'
                              let stime = value + '_stime'
                              let etime = value + '_etime'
                              let fileTime = res.code + '_time'
                              let fileStime = res.code + '_stime'
                              let fileEtime = res.code + '_etime'
                              if (res.code.toUpperCase() == time.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                            }
                          })
                          if (cacheEditLists.length > 0) {
                            cacheEditLists.forEach((lists: any) => {
                              if (lists.code.toUpperCase() == value.toUpperCase()) {
                                sameNamess = true
                              }
                            })
                          }
                          if (sameName) {
                            return {
                              error: true,
                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNames) {
                            return {
                              error: true,
                              msg: '字段名已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNamesss) {
                            return {
                              error: true,
                              msg: '字段名不能和系统字段同名，请换个名字。'
                            };
                          } else if (sameNamess) {
                            return {
                              error: true,
                              msg: '字段名被循环修改过，请换个名字。'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule('isUpdatedBy',(values, value) => {
                          let sameName = false
                          let sameNames = false
                          let sameNamess = false
                          let sameNamesss = false
                          let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                          const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                          const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                          if (value.toUpperCase() === 'ID' ||
                            value.toUpperCase() === treeParentName.toUpperCase() ||
                            value.toUpperCase() === tenantCodeName.toUpperCase() ||
                            value.toUpperCase() === 'CREATEDAT' ||
                            value.toUpperCase() === 'UPDATEDAT' ||
                            value.toUpperCase() === 'CREATEDBY' ||
                            value.toUpperCase() === 'DELETEDBY' ||
                            value.toUpperCase() === 'DELETEDAT' ||
                            value.toUpperCase() === 'DELETED'
                          ) {
                            sameNamesss = true
                          }
                          let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                          dataArr.forEach((res: any) => {
                            if (res.code.toUpperCase() == value.toUpperCase()) {
                              console.log('进入')
                              sameName = true
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            }
                            if (res.type == 'date-range') {
                              let time = value + '_time'
                              let stime = value + '_stime'
                              let etime = value + '_etime'
                              let fileTime = res.code + '_time'
                              let fileStime = res.code + '_stime'
                              let fileEtime = res.code + '_etime'
                              if (res.code.toUpperCase() == time.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                            }
                          })
                          if (cacheEditLists.length > 0) {
                            cacheEditLists.forEach((lists: any) => {
                              if (lists.code.toUpperCase() == value.toUpperCase()) {
                                sameNamess = true
                              }
                            })
                          }
                          if (sameName) {
                            return {
                              error: true,
                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNames) {
                            return {
                              error: true,
                              msg: '字段名已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNamesss) {
                            return {
                              error: true,
                              msg: '字段名不能和系统字段同名，请换个名字。'
                            };
                          } else if (sameNamess) {
                            return {
                              error: true,
                              msg: '字段名被循环修改过，请换个名字。'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule('isCreatedAt',(values, value) => {
                          let sameName = false
                          let sameNames = false
                          let sameNamess = false
                          let sameNamesss = false
                          let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                          const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                          const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                          if (value.toUpperCase() === 'ID' ||
                            value.toUpperCase() === treeParentName.toUpperCase() ||
                            value.toUpperCase() === tenantCodeName.toUpperCase() ||
                            value.toUpperCase() === 'UPDATEDAT' ||
                            value.toUpperCase() === 'CREATEDBY' ||
                            value.toUpperCase() === 'UPDATEBY' ||
                            value.toUpperCase() === 'DELETEDBY' ||
                            value.toUpperCase() === 'DELETEDAT' ||
                            value.toUpperCase() === 'DELETED'
                          ) {
                            sameNamesss = true
                          }
                          let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                          dataArr.forEach((res: any) => {
                            if (res.code.toUpperCase() == value.toUpperCase()) {
                              console.log('进入')
                              sameName = true
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            }
                            if (res.type == 'date-range') {
                              let time = value + '_time'
                              let stime = value + '_stime'
                              let etime = value + '_etime'
                              let fileTime = res.code + '_time'
                              let fileStime = res.code + '_stime'
                              let fileEtime = res.code + '_etime'
                              if (res.code.toUpperCase() == time.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                            }
                          })
                          if (cacheEditLists.length > 0) {
                            cacheEditLists.forEach((lists: any) => {
                              if (lists.code.toUpperCase() == value.toUpperCase()) {
                                sameNamess = true
                              }
                            })
                          }
                          if (sameName) {
                            return {
                              error: true,
                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNames) {
                            return {
                              error: true,
                              msg: '字段名已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNamesss) {
                            return {
                              error: true,
                              msg: '字段名不能和系统字段同名，请换个名字。'
                            };
                          } else if (sameNamess) {
                            return {
                              error: true,
                              msg: '字段名被循环修改过，请换个名字。'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule('isUpdatedAt',(values, value) => {
                          let sameName = false
                          let sameNames = false
                          let sameNamess = false
                          let sameNamesss = false
                          let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                          const tenantCodeName = dataArr.find((res: any) => res.systemFieldType === 9)?.code || 'tenantCode';
                          const treeParentName = dataArr.find((res: any) => res.type === 'parent')?.code || 'parentId';
                          if (value.toUpperCase() === 'ID' ||
                            value.toUpperCase() === treeParentName.toUpperCase() ||
                            value.toUpperCase() === tenantCodeName.toUpperCase() ||
                            value.toUpperCase() === 'CREATEDAT' ||
                            value.toUpperCase() === 'CREATEDBY' ||
                            value.toUpperCase() === 'UPDATEBY' ||
                            value.toUpperCase() === 'DELETEDBY' ||
                            value.toUpperCase() === 'DELETEDAT' ||
                            value.toUpperCase() === 'DELETED'
                          ) {
                            sameNamesss = true
                          }
                          let cacheEditLists = JSON.parse(sessionStorage.getItem('cacheEditList')!)
                          dataArr.forEach((res: any) => {
                            if (res.code.toUpperCase() == value.toUpperCase()) {
                              console.log('进入')
                              sameName = true
                              return {
                                error: true,
                                msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                              };
                            }
                            if (res.type == 'date-range') {
                              let time = value + '_time'
                              let stime = value + '_stime'
                              let etime = value + '_etime'
                              let fileTime = res.code + '_time'
                              let fileStime = res.code + '_stime'
                              let fileEtime = res.code + '_etime'
                              if (res.code.toUpperCase() == time.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + time + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == stime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + stime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (res.code.toUpperCase() == etime.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileTime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileStime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              } else if (fileEtime.toUpperCase() == value.toUpperCase()) {
                                sameNames = true
                                return {
                                  error: true,
                                  msg: '字段名「' + etime + '」已被占用（不区分大小写），请换个名字。'
                                };
                              }
                            }
                          })
                          if (cacheEditLists.length > 0) {
                            cacheEditLists.forEach((lists: any) => {
                              if (lists.code.toUpperCase() == value.toUpperCase()) {
                                sameNamess = true
                              }
                            })
                          }
                          if (sameName) {
                            return {
                              error: true,
                              msg: '字段名「' + value + '」已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNames) {
                            return {
                              error: true,
                              msg: '字段名已被占用（不区分大小写），请换个名字。'
                            };
                          } else if (sameNamesss) {
                            return {
                              error: true,
                              msg: '字段名不能和系统字段同名，请换个名字。'
                            };
                          } else if (sameNamess) {
                            return {
                              error: true,
                              msg: '字段名被循环修改过，请换个名字。'
                            };
                          } else {
                            return true;
                          }
                        });
                        addRule('selectFiled',(values, value)=>{
                              console.log(values,'选择现有bigInt字段')
                              console.log(value,'选择现有bigInt字段1111')
                              let isHaves = false
                              let deleteCode1: any[] = [];
                              const fieldTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                              let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                              let keyArr = JSON.parse(sessionStorage.getItem('keyCrud')!)
                              deleteCode1 = dataArr
                                .filter(item => fieldTypes.includes(item.systemFieldType))
                                .map(item => item.code);
                              const blackList = new Set([
                                'id',
                                'deleted',
                                'deletedAt',
                                'deletedBy',
                                'updatedAt',
                                'createdAt',
                                'createdBy',
                                'updatedBy',
                                value,
                                ...deleteCode1
                              ]);
                              let isTure:any = []
                              keyArr.forEach((element: any) => {
                                let yuan = element.columnNames.split(',')
                                if(element.uniqueFlag){
                                  isTure.push(yuan.filter((res: any) => {
                                    if (!blackList.has(res)) {
                                      return res
                                    }
                                  }))
                                }
                              });
                              console.log(isTure, 'isTure')
                              isTure.forEach(res=>{
                                if (res.length == 0) {
                                  isHaves = true
                                }
                              })
                              if (isHaves) {
                                return {
                                  error: true,
                                  msg: '当前字段转换为系统字段会导致索引列表中包含此字段的唯一索引全部为系统字段，请先手动删除索引'
                                };
                              } else {
                                return true;
                              }
                            })
                        addRule('isSameName',(values, value) => {
                                console.log(values, '显示名称数据')
                                console.log(value, '显示名称数据')
                                let sameName = false
                                let sameNames = false
                                let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                dataArr.forEach((res: any) => {
                                    if (values.needId) {
                                        if (res.name.toUpperCase() == value.toUpperCase() && res.needId != values.needId) {
                                            sameName = true
                                        }
                                    } else {
                                        if (res.name.toUpperCase() == value.toUpperCase() && res.id != values.id) {
                                            sameName = true
                                        }
                                    }
                                  const headNameAll = ['ID', '删除人', '创建人' , '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '更新人', '父级节点']
                                  if(headNameAll.includes(value)) {
                                    sameNames = true
                                  }
                                })
                                if (sameName) {
                                    return {
                                        error: true,
                                        msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                                    };
                                } else if (sameNames) {
                                    return {
                                        error: true,
                                        msg: '显示名称不能与系统字段同名，请换个名字。'
                                    };
                                } else {
                                    return true;
                                }
                            });
                        addRule('isSameTreeName',(values, value) => {
                                let sameName = false
                                let sameNames = false
                                let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                                dataArr.forEach((res: any) => {
                                  if (res.name.toUpperCase() == value.toUpperCase()) {
                                    sameName = true
                                  }
                                  const headNameAll = ['ID', '删除人', '创建人' , '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '更新人']
                                  if(headNameAll.includes(value)) {
                                    sameNames = true
                                  }
                                })
                                if (sameName) {
                                    return {
                                        error: true,
                                        msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                                    };
                                } else if (sameNames) {
                                    return {
                                        error: true,
                                        msg: '显示名称不能与系统字段同名，请换个名字。'
                                    };
                                } else {
                                    return true;
                                }
                            });
                        addRule('isSameCreatedByName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除人', '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '更新人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isSameDeletedByName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '创建人', '更新人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isSameUpdatedByName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除人', '删除时间', '删除标志', '租户编码', '创建时间', '更新时间', '创建人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isSameCreatedAtName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除人', '删除时间', '删除标志', '租户编码', '更新时间', '创建人', '更新人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isSameUpdatedAtName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除人', '删除时间', '删除标志', '租户编码', '创建时间', '创建人', '更新人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isTenantSameName',(values, value) => {
                        let sameName = false
                        let sameNames = false
                        let dataArr = JSON.parse(sessionStorage.getItem('fieldCrud')!)
                        dataArr.forEach((res: any) => {
                          if (res.name.toUpperCase() == value.toUpperCase()) {
                            sameName = true
                          }
                          const headNameAll = ['ID', '删除人', '创建人' , '删除时间', '删除标志', '创建时间', '更新时间', '更新人', '父级节点']
                          if(headNameAll.includes(value)) {
                            sameNames = true
                          }
                        })
                        if (sameName) {
                          return {
                            error: true,
                            msg: '显示名称「' + value + '」已被占用（不区分大小写），请换个名字。'
                          };
                        } else if (sameNames) {
                          return {
                            error: true,
                            msg: '显示名称不能与系统字段同名，请换个名字。'
                          };
                        } else {
                          return true;
                        }
                      });
                        addRule('isHaveMo',(values, value) => {
                                console.log(values, '校验默认值')
                                console.log(value, '默认值数据')
                                let sameName = false
                                if (values.fieldType != "boolean") {
                                    if (values.nullable) {
                                        if (values.fieldType == 'date-range') {
                                            if (value == '') {
                                                sameName = true
                                            }
                                        } else {
                                            if (!value && (values.fieldType != 'text' && values.fieldType != 'textarea' && values.fieldType != 'user' && values.fieldType != 'users' && values.fieldType != 'department')) {
                                                sameName = true
                                                if (value == 0) {
                                                    sameName = false
                                                }
                                            } else if (!values.defaultValue && (values.fieldType != 'text' && values.fieldType != 'textarea' && values.fieldType != 'user' && values.fieldType != 'users' && values.fieldType != 'department')) {
                                                sameName = true
                                            } else if (values.defaultValue == '' && (values.fieldType != 'text' && values.fieldType != 'textarea' && values.fieldType != 'user' && values.fieldType != 'users' && values.fieldType != 'department')) {
                                                sameName = true
                                            }
                                        }
                                    }
                                }
                                if (sameName) {
                                    return {
                                        error: true,
                                        // msg: '已允许空值，请设置默认值'
                                        msg: '这是必填项'
                                    };
                                } else {
                                    return true;
                                }
                            });
                        addRule('idJoin',(values, value) => {
                                console.log(values, '校验默认值')
                                console.log(value, '默认值数据')
                                let sameName = false
                                if (values.joinColumnCode == values.inverseJoinColumnCode) {
                                    sameName = true
                                }
                                doAction({
                                  actionType: 'validateFormItem',
                                  componentId: 'joinTableCode'
                                });
                                if (sameName) {
                                    return {
                                        error: true,
                                        msg: '字段名与关联目标字段名重复，请修改'
                                    };
                                } else {
                                    return true;
                                }
                            });
                        addRule('idJoins',(values, value) => {
                                console.log(values, '校验默认值')
                                console.log(value, '默认值数据')
                                let sameName = false
                                let sameNames = false
                                if(value == ''){
                                    sameNames = true
                                }else if (values.joinColumnCode == values.inverseJoinColumnCode) {
                                    sameName = true
                                }
                                doAction({
                                  actionType: 'validateFormItem',
                                  componentId: 'joinTableCode'
                                });
                                if (sameNames) {
                                    return {
                                        error: true,
                                        msg: '这是必选项'
                                    };
                                }else if (sameName) {
                                    return {
                                        error: true,
                                        msg: '字段名与关联本身字段名重复，请重新选择'
                                    };
                                } else {
                                    return true;
                                }
                            });
                        addRule('longDatas',(values: any, value: any) => {
                              console.log(values, '新增长度值');
                              console.log(value, '新增长度值1111');
                              let sameName = false;
                              let sameNames = false;
                                if(Number(value)>768 && values.unique){
                                    sameName = true
                                }
                              if (sameName) {
                                return {
                                  error: true,
                                  msg:
                                    '长度大于768不能作为唯一索引'
                                };
                              } else if (sameNames) {
                                return {
                                  error: true,
                                  msg: '该字段已被设为索引，长度不能超过768'
                                };
                              } else {
                                return true;
                              }
                            });
                        addRule('isRulesVal',(values: any, value: any) => {
                              console.log(values, '组合规则');
                              console.log(value, '组合规则1111');
                              let sameName = false;
                              let sameNames = false;
                              if(value.length==0){
                                sameName = true
                              }else{
                                let filterData:any = []
                                filterData = value.filter(sre=>{
                                  return sre.type == 'auto-increase'
                                })
                                console.log(filterData,'filterData')
                                if(filterData.length == 0){
                                  sameNames = true
                                }
                                if(filterData.length > 1){
                                  sameNames = true
                                }
                              }

                              if (sameName) {
                                return {
                                  error: true,
                                  msg:
                                    '组合规则不能为空'
                                };
                              } else if (sameNames) {
                                return {
                                  error: true,
                                  msg: '组合规则有且只能有一个自动编码'
                                };
                              } else {
                                return true;
                              }
                            });
                        addRule('timeRule',(values,value) => {
                          let isNot = false;
                          isNot = !(validateTimeInput(value,values.fieldType, values.precision))
                          if(isNot){
                            return {
                              error: true,
                              msg: '请根据精度输入正确格式默认值'
                            };
                          } else {
                            return true;
                          }
                        });
                        console.log(_,doAction,event, '模型设计')
                        sessionStorage.removeItem('keyCrud')
                        sessionStorage.removeItem('fieldCrud')
                        sessionStorage.removeItem('intList')
                        sessionStorage.removeItem('cuList')
                        sessionStorage.removeItem('cuTimeList')
                        sessionStorage.removeItem('treeList')
                        sessionStorage.removeItem('formulaData') // 公式数据
                        sessionStorage.removeItem('validatorCrud')
                        sessionStorage.removeItem('dataValue')
                        // sessionStorage.removeItem('affectCrud')
                        sessionStorage.removeItem('removeRelations')
                        sessionStorage.removeItem('cacheEditList')
                        sessionStorage.removeItem('yuanData')
                        sessionStorage.removeItem('acl')
                        sessionStorage.removeItem('haveQueryKeyKey')
                        // getTableData(event.data.queryKey).then((res: any) => {
                        //     console.log(res, '获取列表详情数据')
                        //     sessionStorage.setItem('fieldCrud', JSON.stringify(res.data.data.fields))
                        //     sessionStorage.setItem('acl', JSON.stringify(res.data.data.acl))
                        //     sessionStorage.setItem('keyCrud', JSON.stringify(res.data.data.indexes))
                        //     let relaArr: any = []
                        //     res.data.data.relations.forEach((item: any) => {
                        //         // res['foreignKey'] = res.name
                        //         // res['foreignKeyCode'] = res.name
                        //         if (item.relationMode == 0) {
                        //             relaArr.push({ ...item, disNullable: item.nullable, foreignKey: item.name })
                        //         } else if (item.relationMode == 1) {
                        //             relaArr.push({ ...item, disNullable: item.nullable, foreignKey: item.name })
                        //         } else {
                        //             relaArr.push({ ...item, foreignKey: item.name })
                        //         }
                        //     })
                        //     sessionStorage.setItem('affectCrud', JSON.stringify(relaArr))
                        //     sessionStorage.setItem('cacheEditList', JSON.stringify([]))
                        //     sessionStorage.setItem('removeRelations', JSON.stringify([]))
                        //     let formulArr: any[] = []
                        //     res.data.data.fields.forEach((item: any) => {
                        //         if (item.type != 'formula'
                        //             && item.systemFieldType != 8
                        //             && item.systemFieldType != 7
                        //             && item.systemFieldType != 6) {
                        //             formulArr.push(item)
                        //         }
                        //     })
                        //     sessionStorage.setItem('formulaData', JSON.stringify(formulArr))
                        //     let fieldKeyCruds = res.data.data.fields.map((res: any) => {
                        //         if (res.type != 'relation' && res.type != 'formula'
                        //             && res.type != 'textarea'
                        //             && res.type != 'rich-text'
                        //             && res.type != 'json'
                        //             && res.type != 'attachment'
                        //             && res.type != 'image'
                        //             && res.type != 'ciphertext'
                        //             && res.type != 'users'
                        //         ) {
                        //             if (res.type == 'text' && res.config.length < 768) {
                        //                 return res
                        //             } else if (res.type != 'text') {
                        //                 return res;
                        //             }
                        //         }
                        //     })
                        //     console.log(fieldKeyCruds, 'fieldKeyCruds')
                        //     sessionStorage.setItem('fieldKeyCruds', JSON.stringify(fieldKeyCruds))
                        //     setTimeout(() => {
                        //         console.log(res.data.data,'接口获取的数据')
                        //         doAction({
                        //             actionType: "setValue", componentId: "myField", "args": {
                        //                 "value": {
                        //                     "items": res.data.data.fields
                        //                 }
                        //             }
                        //         });
                        //         doAction({
                        //             actionType: "setValue", componentId: "keyCrud", "args": {
                        //                 "value": {
                        //                     "items": res.data.data.indexes
                        //                 }
                        //             }
                        //         });
                        //         doAction({
                        //             actionType: "setValue", componentId: "affectCrud", "args": {
                        //                 "value": {
                        //                     "items": relaArr
                        //                     // "items": res.data.data.relations
                        //                 }
                        //             }
                        //         });
                        //     }, 1000);
                        //     // }, 180);
                        // })
                        getAllSimple().then((res: any) => {
                            usersList = res.data.data
                            setTimeout(() => {
                                console.log(res.data.data,'接口获取的数据')
                                doAction({
                                    actionType: "setValue", componentId: "myField", "args": {
                                        "value": {
                                            "items": sessionStorage.getItem('fieldCrud') != 'undefined' ? JSON.parse(sessionStorage.getItem('fieldCrud')) : []
                                        }
                                    }
                                });
                                doAction({
                                    actionType: "setValue", componentId: "keyCrud", "args": {
                                        "value": {
                                            "items": sessionStorage.getItem('keyCrud') != 'undefined' ? JSON.parse(sessionStorage.getItem('keyCrud')) : []
                                        }
                                    }
                                });
                                doAction({
                                    actionType: "setValue", componentId: "affectCrud", "args": {
                                        "value": {
                                            "items": sessionStorage.getItem('affectCrud') != 'undefined' ? JSON.parse(sessionStorage.getItem('affectCrud')) : []
                                        }
                                    }
                                });
                            }, 1000);
                        });
                    },
                },
            ]
        }
    }
}
