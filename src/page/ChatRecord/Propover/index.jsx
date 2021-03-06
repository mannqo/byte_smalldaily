import { Popover, Avatar, Skeleton } from 'antd-mobile';
import './index.css';
import cookie from 'react-cookies';
import { useHistory } from 'react-router-dom';
import { useEffect } from 'react';

export const PropoverWrapper = (props) => {
    // 这个userInfo是聊天对象的个人信息
    const { userInfo, chatRecord, visible, skeletonVisible } = props;
    const user = cookie.load('userInfo');  // user是用户本人的个人信息 

    return (
        <div className='popover'>
            {
                skeletonVisible ?
                    (new Array(8).fill(null)).map((_, idx) =>
                        <PopoverItem
                            visible={true}
                            key={idx}
                            content={<Skeleton.Title animated style={{ width: 300, height: 24, margin: 0 }} />}
                            direct='right'
                            classname='dialog rightDialog' />
                    ) :
                    chatRecord && chatRecord.map(record => (
                        record.userId === user.userId ?
                            <PopoverItem
                                visible={visible}
                                key={record.messageId}
                                avatar={user.avatar}
                                userId={user.userId}
                                content={record.message}
                                direct='left'
                                classname='dialog leftDialog' />
                            :
                            <PopoverItem
                                visible={visible}
                                key={record.messageId}
                                avatar={userInfo.avatar}
                                userId={userInfo.userId}
                                content={record.message}
                                direct='right'
                                classname='dialog rightDialog'
                            />
                    ))
            }
        </div>
    )
}

const PopoverItem = (props) => {
    const { userId, avatar, content, direct, classname, visible } = props;
    const history = useHistory();
    const toPersonalPage = async () => {
        history.push('/other/page/' + userId);
    }
    return (
        <div className={classname + ' animate__animated animate__fadeIn'}>
            <Popover content={content} placement={direct} destroyOnHide defaultVisible visible={visible}>
                <Avatar
                    onClick={toPersonalPage}
                    src={avatar}
                    style={{ borderRadius: '50%', '--size': '60px' }}
                    lazy
                />
            </Popover>
        </div>
    )
}

// Popover组件使用时，如果气泡在左侧，如果左侧空间不够，默认会将气泡移动到右侧