import { List, Image } from 'antd-mobile';
import React, { memo } from 'react';
import { useHistory } from 'react-router-dom';

export default memo(function CommentItem(props) {  
    const { articleInfo, reviews, userInfo } = props.info; 
    const { articleId, images } = articleInfo;
    const { parentReviewId, postDate } = reviews;
    const { nickname, avatar } = userInfo;
    const displayStatus = images[0] ? 'block' : 'none';
    const description = !parentReviewId ?
        '评论了你的笔记'
        : '回复了你的评论';
    const history = useHistory();
    const toArticleDetail = () => {
        history.push('/post/detail/' + articleId)
    }
    return (
        <List.Item
            className='animate__animated animate__fadeIn'
            onClick={toArticleDetail}
            key={postDate}
            prefix={
                <Image
                    src={avatar}
                    style={{ borderRadius: 20 }}
                    fit='cover'
                    width={40}
                    height={40}
                />
            }
            extra={
                <Image
                    src={images && images[0]}
                    width={40}
                    height={40}
                    style={{ display: displayStatus }}
                />
            }
            description={description}
        >
            {nickname}
        </List.Item >
    );
});
