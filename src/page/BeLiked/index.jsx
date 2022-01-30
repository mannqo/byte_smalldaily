import { NavBar } from 'antd-mobile';
import React, { memo } from 'react';
import { useHistory } from 'react-router-dom';

export default memo(function BeLiked() {
    const history = useHistory();
    const back = () => {
        history.go(-1);
    }
    return (
        <>
            <NavBar onBack={back} >赞和收藏 </NavBar>
        </>

    );
});
