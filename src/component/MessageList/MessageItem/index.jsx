import { List, Image } from 'antd-mobile'
import React, { memo } from 'react'
import { useHistory } from 'react-router-dom';



export default memo(function MessageItem(props) {
    const { nickname, avatar, description, userId } = props.user;

    const history = useHistory();
    const goToMessageDetail = () => {
        history.push('/message/detail/' + userId);
    }
    return (
        <List.Item
            className='animate__animated animate__fadeIn'
            prefix={
                <Image
                    src={avatar}
                    style={{ borderRadius: 20 }}
                    fit='cover'
                    width={40}
                    height={40}
                />
            }
            description={description}
            onClick={goToMessageDetail}
        >
            {nickname}
        </List.Item>
    )
})

