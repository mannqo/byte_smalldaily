import { Button, Dialog, Image, InfiniteScroll, Input, Loading, NavBar, Popup, PullToRefresh, Skeleton, Space, Swiper, Tag, TextArea, Toast } from "antd-mobile";
import {
    SendOutline,
    FrownOutline,
    HeartOutline,
    StarOutline,
    MessageOutline,
    UserCircleOutline,
    SmileOutline,
    HeartFill,
    StarFill,
} from 'antd-mobile-icons'
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import styled from "styled-components";
import MyAvatar from "./component/MyAvatar";
import { ReviewArea } from "./component/review";
import { sleep } from 'antd-mobile/es/utils/sleep';
import { getArticleById, likeArticle, getLikedArticles, starArticle, unlikeArticle, unstarArticle, getStaredArticles } from "../../services/article";
import { cancelFollow, followOthers, getBaseUserInfo, getFollowsList } from "../../services/users";
import { getLikedReviews, getReviewByArticle, postReview } from "../../services/review";
import { ExecuteError } from "../../services/axios";
import cookie from 'react-cookies';
import ImagePlaceholder from "../../component/ImagePlaceholder";
import ImageFallback from "../../component/ImageFallback";
import Share from "../../component/Share";

type UserInfo = {
    avatar: string,
    nickname: string,
    userId: number,
}

type UserFullInfo = {
    avatar: string,
    nickname: string,
    userId: number,
    fans: number[],
    follows: number[],
    likedArticles: string[],
    likedReviews: string[],
    staredArticles: string[],
}

type NumOrString = number | string;
type Article = {
    _id: string,
    authorId: number,
    images: string[],
    title: string,
    content: string,
    tags: string[],
    likes: NumOrString,
    stars: NumOrString,
    reviews: NumOrString,
    postDate: string,
    articleId: number
}
type Review = {
    _id: string,
    authorId: number,
    authorInfo: UserInfo,
    content: string,
    likes: NumOrString,
    postDate: string,
    reviewId: number,
    replyToUserId: number,
    replyToArticleId: number,
    parentReviewId?: number,
    reviewList: Review[]
}
export type { UserFullInfo, UserInfo, Article, Review };

export default function PostDetail() {
    const history = useHistory();
    const userInfo = cookie.load('userInfo') as UserFullInfo;
    if (!userInfo) history.push('/login');

    const param = useParams<{ articleId: string | undefined }>()
    const articleId = Number(param.articleId);

    // State
    let [article, setArticle] = useState<Article>({
        _id: '',
        authorId: 0,
        images: [],
        title: "",
        content: "",
        tags: [],
        likes: 0,
        stars: 0,
        reviews: 0,
        postDate: "",
        articleId: 0
    });
    let [reviews, setReviews] = useState<Review[]>([]);
    let [reviewTimes, setReviewTimes] = useState(0);
    let [authorInfo, setAuthorInfo] = useState<UserInfo>({
        avatar: "",
        nickname: "",
        userId: 0
    });
    let [followed, setFollowed] = useState(false);
    let [liked, setLiked] = useState(false);
    let [stared, setStared] = useState(false);
    let [likedReviews, setLikedReviews] = useState<string[]>([]);
    let [popupVisible, setPopupVisible] = useState(false);
    let [shareVisible, setShareVisible] = useState(false);
    let [showPostBtn, setShowPostBtn] = useState(false);
    let [inputValue, setInputValue] = useState('');
    let [hasMoreReviews, setHasMoreReviews] = useState(true);
    let [skeletonLoading, setSkeletonLoading] = useState(true);
    // ??????????????????
    let [inputPlaceHolder, setInputPlaceHolder] = useState('?????????????????????????????????~');
    type ReviewTo = { userId: number, parentReviewId?: number };
    let [reviewTo, setReviewTo] = useState<ReviewTo>({
        userId: 0
    });

    // Effect
    useEffect(() => {
        refresh();
    }, []);

    // ????????????
    const refresh = async () => {
        try {
            let article = (await getArticleById({ articleId })).article as Article;
            const reviewList = (await getReviewByArticle({ articleId, pages: 0 })).reviews as Review[];
            for (const reviewItem of reviewList) {
                await fillReviewAuthorInfo(reviewItem);
            }
            const authorJson = (await getBaseUserInfo({ userId: article.authorId })).user;
            authorJson.userId = article.authorId;
            const followsList = (await getFollowsList({ userId: userInfo.userId })).followsList.map((i: any) => i.userId);
            const likedArticles = (await getLikedArticles({ userId: userInfo.userId })).likedArticles.map((i: any) => i._id);;
            const staredArticles = (await getStaredArticles({ userId: userInfo.userId })).staredArticles.map((i: any) => i._id);;
            const reviews = (await getLikedReviews({ userId: userInfo.userId })).likedReviews.map((i: any) => i._id);;
            // ?????????
            article = converter(article) as Article;
            // ??????state
            setLiked(likedArticles.includes(article._id));
            if (likedArticles.includes(article._id) && typeof article.likes === 'number') {
                article.likes -= 1;
            }
            setStared(staredArticles.includes(article._id));
            if (staredArticles.includes(article._id) && typeof article.stars === 'number') {
                article.stars -= 1;
            }
            setArticle(article);
            setReviews(reviewList);
            setAuthorInfo(authorJson);
            setFollowed(followsList.includes(authorJson.userId));
            setLikedReviews(reviews);
            setSkeletonLoading(false);
            // ????????????????????????????????????
            setHasMoreReviews(true);
            if (reviewList.length >= 10) {
                setReviewTimes(1);
            } else {
                setReviewTimes(0);
            }
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ??????????????????
    const loadMoreReviews = async (reset = false) => {
        try {
            const reviewList = (await getReviewByArticle({ articleId, pages: reset ? 0 : reviewTimes })).reviews as Review[];
            if (reviewList.length < 10) {
                setHasMoreReviews(false);
            } else {
                setReviewTimes(reset ? 1 : reviewTimes + 1);
            }
            for (const reviewItem of reviewList) {
                await fillReviewAuthorInfo(reviewItem);
            }
            for (let review of reviews) {
                let findRes = reviewList.find(item => item._id === review._id);
                if (!findRes) {
                    reviewList.push(review);
                }
            }
            // ??????
            sorter(reviewList);
            reviewList.forEach(function f(item) {
                sorter(item.reviewList);
            })
            setReviews(reviewList);
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ????????????
    const shareBtn = () => {
        setShareVisible(true);
    }

    // ???????????????????????????
    const followBtn = async () => {
        try {
            if (followed) {
                // ????????????
                Dialog.confirm({
                    content: '????????????????????????',
                    onConfirm: async () => {
                        await cancelFollow({ userId: userInfo.userId, followerId: authorInfo.userId });
                        setFollowed(false);
                    },
                    closeOnMaskClick: true
                })
            } else {
                // ??????
                await followOthers({ userId: userInfo.userId, followerId: authorInfo.userId });
                setFollowed(true);
            }
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ??????????????????????????????
    const dislikeBtn = (e: React.MouseEvent) => {
        Toast.show('?????????');
    }

    // ???????????????????????????
    const gotoUserPage = (userId: number) => {
        history.push('/other/page/' + userId);
    }

    // ???????????????...
    const search = (text: string) => {
        history.push('/search/' + text);
    }

    // ????????????
    const likeBtn = async () => {
        try {
            if (liked) {
                await unlikeArticle({ userId: userInfo.userId, articleId: articleId });
            } else {
                await likeArticle({ userId: userInfo.userId, articleId: articleId });
            }
            setLiked(!liked);
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ????????????
    const starBtn = async () => {
        try {
            if (stared) {
                await unstarArticle({ userId: userInfo.userId, articleId: articleId });
            } else {
                await starArticle({ userId: userInfo.userId, articleId: articleId });
            }
            setStared(!stared);
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ?????????????????????
    const reviewBtn = (userId: number, userName?: string, parentReviewId?: number) => {
        if (userName) {
            setInputPlaceHolder(`??????@${userName}???`);
        } else {
            setInputPlaceHolder("?????????????????????????????????~");
        }
        setReviewTo({ userId, parentReviewId });
        setPopupVisible(true);
        const input = document.querySelector('.popup textarea');
        if (input instanceof HTMLElement) {
            // ?????????????????????????????????????????????focus
            setTimeout(() => { input.focus() });
        }
    }

    // ????????????
    const postBtn = async () => {
        try {
            await postReview({
                replyToUserId: reviewTo.userId,
                replyToArticleId: articleId,
                parentReviewId: reviewTo.parentReviewId,
                authorId: userInfo.userId,
                content: inputValue,
            });
            setInputValue('');
            Toast.show('????????????');
            loadMoreReviews(true);
        } catch (err) {
            Toast.show((err as ExecuteError).message);
        }
    }

    // ????????????????????????????????????
    const right = <Space align="end" style={{
        fontSize: '24px',
        '--gap-horizontal': '12px',
    }}>
        <Button
            size="mini"
            fill="outline"
            shape="rounded"
            color={followed ? "default" : "primary"}
            onClick={followBtn}>
            {followed ? '?????????' : '??????'}
        </Button>
        <SendOutline onClick={shareBtn} style={{ cursor: 'pointer' }} />
    </Space>

    // ?????????Items
    const swiperItems = article.images.map((url, idx) =>
        <Swiper.Item key={idx}>
            <Image
                src={url}
                style={{ width: '100%' }}
                lazy
                fallback={<ImageFallback />}
                placeholder={<ImagePlaceholder />}
            ></Image>
        </Swiper.Item>
    )

    // ?????????Tags
    const tagItems = article.tags.map((text, idx) =>
        <Tag
            className="tag"
            color="primary"
            fill="outline"
            style={{
                '--border-color': 'transparent',
                'cursor': 'pointer'
            }}
            key={idx}
            onClick={() => search(text)}
        >
            {text}
        </Tag>
    )

    return (
        <Container>
            {/* ??????????????? */}
            <NavBar onBack={history.goBack} right={right} className="nav">
                <Space
                    className="top"
                    align="center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => gotoUserPage(authorInfo.userId)}
                >
                    <MyAvatar src={authorInfo.avatar} />
                    <span style={{ fontSize: '1rem' }}>{authorInfo.nickname}</span>
                </Space>
            </NavBar>
            {/* ?????????????????????&???????????? */}
            <div className="content">
                <PullToRefresh onRefresh={refresh}>
                    {/* ????????? */}
                    {swiperItems.length > 0 ? <Swiper rubberband={false} style={{ '--track-padding': ' 0 0 12px' }}>{swiperItems}</Swiper> : undefined}
                    {/* ?????????????????????????????? */}
                    <article>
                        {/* ????????? */}
                        {skeletonLoading ? <>
                            <Skeleton.Title animated />
                            <Skeleton.Paragraph animated />
                        </> : undefined}
                        {/* ???????????? */}
                        <h3>{article.title}</h3>
                        <div>{article.content}</div>
                        {tagItems.length > 0 ? <Space block wrap={true} style={{ '--gap-vertical': '0' }}>{tagItems}</Space> : undefined}
                        <Space block justify="between" align="center">
                            <span className="date">{article.postDate}</span>
                            <Button
                                size="mini"
                                fill="outline"
                                shape="rounded"
                                color="default"
                                onClick={dislikeBtn}>
                                <FrownOutline /> ?????????
                            </Button>
                        </Space>
                        {/* ?????? */}
                        <hr />
                        {/* ????????????????????? */}
                        <Space block>{`??? ${article.reviews} ?????????`}</Space>
                        <Space className="review-space" block align="center">
                            <MyAvatar src={userInfo.avatar} />
                            <div onClick={() => reviewBtn(authorInfo.userId)} style={{ flexGrow: '1' }}>
                                <Input
                                    placeholder="?????????????????????????????????~"
                                    disabled
                                    style={{
                                        '--font-size': '0.8rem',
                                        backgroundColor: 'rgb(204, 204, 204, 0.4)',
                                        '--placeholder-color': 'grey',
                                        padding: '4px 16px',
                                        borderRadius: 'calc(0.8rem + 4px)',
                                        cursor: 'text'
                                    }}
                                />
                            </div>
                        </Space>
                        {/* ?????????????????? */}
                        <ReviewArea reviews={reviews} likedReviews={likedReviews} enterUserHomePage={gotoUserPage} reviewCallback={reviewBtn} />
                        {skeletonLoading ? <Loading /> : <InfiniteScroll hasMore={hasMoreReviews} loadMore={() => loadMoreReviews()} />}
                    </article>
                </PullToRefresh>
            </div>
            {/* ??????fixed??? */}
            <Space className="bottom" block align="center">
                <div onClick={() => reviewBtn(authorInfo.userId)}>
                    <Input
                        placeholder="?????? ????????????..."
                        style={{
                            '--font-size': '1rem',
                            backgroundColor: 'rgb(204, 204, 204, 0.4)',
                            '--placeholder-color': 'grey',
                            padding: '4px 16px',
                            borderRadius: 'calc(1rem + 4px)',
                            cursor: 'text',
                        }}
                        disabled
                    />
                </div>
                <Space
                    align="center"
                    style={{ '--gap-horizontal': '2px', cursor: 'pointer' }}
                    onClick={() => likeBtn()}
                >
                    {liked ? < HeartFill fontSize="28px" style={{ cursor: 'pointer' }} color="red" /> :
                        <HeartOutline fontSize="28px" style={{ cursor: 'pointer' }} />}
                    {
                        typeof article.likes === 'number' ? (article.likes + (liked ? 1 : 0)) : article.likes
                    }
                </Space>
                <Space
                    align="center"
                    style={{ '--gap-horizontal': '2px', cursor: 'pointer' }}
                    onClick={() => starBtn()}
                >
                    {stared ? <StarFill fontSize="28px" style={{ cursor: 'pointer' }} color="orange" /> :
                        <StarOutline fontSize="28px" style={{ cursor: 'pointer' }} />}
                    {
                        typeof article.stars === 'number' ? (article.stars + (stared ? 1 : 0)) : article.stars
                    }
                </Space>
                <Space
                    align="center"
                    style={{ '--gap-horizontal': '2px', cursor: 'pointer' }}
                    onClick={() => reviewBtn(authorInfo.userId)}
                >
                    <MessageOutline fontSize="28px" style={{ cursor: 'pointer' }} />
                    {article.reviews}
                </Space>
            </Space>
            {/* ??????????????? */}
            <Popup
                visible={popupVisible}
                onMaskClick={() => setPopupVisible(false)}
            >
                <PopupContainer>
                    <Space className="popup" block style={{ '--gap-horizontal': '0' }}>
                        <Space className="input" block align="center">
                            <TextArea
                                value={inputValue}
                                placeholder={inputPlaceHolder}
                                rows={1}
                                style={{
                                    '--font-size': '1rem',
                                    '--placeholder-color': 'grey',
                                    cursor: 'text'
                                }}
                                onChange={(str) => {
                                    setInputValue(str);
                                    str === '' ? setShowPostBtn(false) : setShowPostBtn(true);
                                }}
                            />
                            {/* @??????????????? */}
                            <UserCircleOutline
                                onClick={() => {
                                    setInputValue(inputValue + '@');
                                    const input = document.querySelector('.popup textarea');
                                    if (input instanceof HTMLElement) {
                                        input.focus();
                                    }
                                }}
                            />
                            {/* TODO: ????????????????????? */}
                            <SmileOutline />
                        </Space>
                        <Button
                            className={showPostBtn ? "" : "hidden"}
                            style={{ marginLeft: '4px' }}
                            color="primary"
                            shape="rounded"
                            onClick={() => postBtn()}
                        >
                            ??????
                        </Button>
                    </Space>
                </PopupContainer>
            </Popup>
            {/* ?????? */}
            <Share visible={shareVisible} setVisible={setShareVisible} />
        </Container>
    );
}

// ??????????????????
const parseNum = (num: number | string) => {
    if (typeof num === 'string') {
        return num;
    }
    if (num < 10000) {
        return num;
    }
    return (num / 10000).toFixed(1) + '???';
}

// ??????????????????????????????
const parseDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    if (date.toString() === 'Invalid Date') return dateStr;
    if (now.getFullYear() === date.getFullYear()) {
        // ??????
        if (date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) {
            // ??????
            let second = Math.floor((now.getTime() - date.getTime()) / 1000);
            if (second < 60) {
                return '??????';
            } else if (second < 3600) {
                let minute = Math.floor(second / 60);
                return minute + ' ?????????';
            } else {
                let hour = Math.floor(second / 3600);
                return hour + ' ?????????';
            }
        } else {
            date.setDate(date.getDate() + 1);
            if (date.getMonth() === now.getMonth() && date.getDate() === now.getDate()) {
                // ??????
                return '?????? ' + `0${date.getHours()}`.slice(-2) + ':' + `${date.getMinutes()}`.slice(-2);
            } else {
                // ??????
                date.setDate(date.getDate() - 1);
                // ????????????
                return date.toLocaleDateString().replaceAll('/', '-').slice(5);
            }
        }
    } else {
        // ????????????
        return date.toLocaleDateString().replaceAll('/', '-');
    }
}

// Num???Date???????????????
export const converter = (obj: { likes?: number | string, stars?: number | string, reviews?: number | string | Array<any>, postDate?: string }) => {
    let copy = { ...obj };
    if (obj.likes !== undefined) {
        copy.likes = parseNum(obj.likes);
    }
    if (obj.stars !== undefined) {
        copy.stars = parseNum(obj.stars);
    }
    if (obj.reviews !== undefined && !(obj.reviews instanceof Array)) {
        copy.reviews = parseNum(obj.reviews);
    }
    if (obj.postDate !== undefined) {
        copy.postDate = parseDate(obj.postDate);
    }
    return copy;
}

// ??????likes??????postDate?????????likes?????????????????????postDate
export const sorter = (arr: Array<{ likes: number | string, postDate: string }>) => {
    // ???????????????
    arr.sort((b, a) => {
        if (a.likes !== b.likes) {
            return (a.likes as number) - (b.likes as number);
        } else {
            return (new Date(a.postDate)).getTime() - (new Date(b.postDate)).getTime();
        }
    })
}

// ??????authorId????????????authorInfo?????????
const fillReviewAuthorInfo = async (review: Review) => {
    try {
        for (const reviewItem of review.reviewList) {
            await fillReviewAuthorInfo(reviewItem);
        }
        if (review.authorInfo) {
            return;
        }
        review.authorInfo = (await getBaseUserInfo({ userId: review.authorId })).user as UserInfo;
        review.authorInfo.userId = review.authorId;
    } catch (err) {
        Toast.show((err as ExecuteError).message);
    }
}

const Container = styled.div` 
    *{
        box-sizing: border-box;
    }

    .nav {
        position: fixed;
        top: 0;
        width: 100%;
        background-color: #fff;
        z-index: 999;
    }

    .content {
        margin-top: 45px;
    }

    button[type="button"]{
        font-size: 12px;
        white-space: pre;
    }

    .adm-nav-bar-left{
        flex: 0;
    }
    
    .top{
        width: 100%;
    }

    .adm-swiper-track-inner{
        align-items: center;
    }

    article{
        padding: 0 12px;
        margin-bottom: 36px;
    }

    article *{
        white-space: pre-line;
        line-height: 1.2rem;
    }

    article h3{
        margin: 8px 0;
    }

    article > *{
        margin: 4px 0;
    }

    .tag::before{
        content: '#'
    }

    .date{
        color: grey;
        font-size: 0.7em;
    }

    hr{
        margin: 12px 0;
        border-color: #f8f8f838;
        border-width: 0.5px 0 0 0;
    }

    input[disabled]{
        cursor: text;
        z-index: -1;
    }

    .review-space>:last-child{
        display: flex;
        flex-grow: 1;
    }

    .bottom{
        position: fixed;
        width: 100%;
        padding: 6px 12px;
        background-color: white;
        bottom: 0;
        font-weight: bold;
    }

    .bottom>:first-child{
        flex: auto;
    }
`

const PopupContainer = styled.div`
    *{
        box-sizing: border-box;
    }

    .popup{
        padding: 6px 12px;
    }

    .input{
        background-color: rgb(204, 204, 204, 0.4);
        border-radius: calc(1rem + 4px);
        padding: 4px 16px;
        font-size: 28px;
    }

    .popup>:first-child,
    .input>:first-child{
        flex: auto;
    }

    .hidden{
        display: none;
    }
`