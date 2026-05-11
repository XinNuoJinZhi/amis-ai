import React, { useState, useEffect, useRef } from 'react';
import { Input } from 'antd';
import { IconJson } from './data'
import './index.css'

const IConSelect: React.FC = (props, ref) => {

  const [value, setValue] = useState('');
  const [showSelect, setShowSelect] = useState(false);
  const [list, setList] = useState(IconJson['fa:']);
  const [ulStyle, setUlStyle] = useState(false);
  const onChangeIcon = (item) =>{
    setValue('fa fa-'+item);
    setShowSelect(false);
    props?.sendValueToFather('fa fa-'+item);
  }
  // const inputFocus = () =>{
  //   setShowSelect(true)
  // }
  const onInputChange = (e:any)=>{
    setValue(e.target.value);
    // let listData = list.filter((v) => v.includes(e.target.value))
    // setList(listData)
    // if(listData.length ==0){
    //   setUlStyle(true)
    // } else {
    //   setUlStyle(false)
    // }
    setShowSelect(true)
    if(e.target.value == ''){
      setShowSelect(false)
      props?.sendValueToFather('');
    }
  }
  const inputClick = () =>{
    setShowSelect(!showSelect)
    setList(IconJson['fa:'])
    if(showSelect == false){
      setUlStyle(false)
    }
  }
  const iconItemStyle = (item)=>{
    if(value === 'fa fa-' + item){
      return {
        borderColor: "#409eff",
        color: "#409eff"
      }
    }
  }

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);
  return (
      <>
        <div className='iconSelect'>
          <Input type="text" value={value}  className='input' onClick={inputClick} allowClear onChange={onInputChange}  />
          {
            showSelect ? 
              <ul className={ulStyle ? 'borderNone' : 'border' }>
              {
                list.map((item,key)=>(
                    <li key={key} title={item} onClick={()=>onChangeIcon(item)} style={iconItemStyle(item)}>
                    {/* <FontAwesomeIcon icon={item} /> */}
                    <i className={`fa fa-${item}`}></i>
                  </li>
                  )
                )
              }
              </ul> : " " 
          }
        </div>
      </>
  )
}

export default IConSelect;

