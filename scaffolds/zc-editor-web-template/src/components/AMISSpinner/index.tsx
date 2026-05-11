import React from "react"
import { Spinner } from 'amis';
import './index.css'

const AMISSpinner = () => {
    return (
        <div className="AMISSpinner">
            <Spinner size='lg' tip='加载中' />
        </div>
    )
}

export default AMISSpinner;

