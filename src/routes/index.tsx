import { Redirect } from "react-router-dom";
import BeLiked from "../page/BeLiked";
import ChatRecord from "../page/ChatRecord";
import Fans from "../page/Fans";
import PostDetail from "../page/PostDetail";
import Search from "../page/Search";
import Tabbar from "../page/Tabbar";
import HomePage from "../page/Tabbar/HomePage";
import Message from "../page/Tabbar/Message";
import PersonalCenter from "../page/Tabbar/PersonalCenter";
import Login from "../page/Login";
import Follows from "../page/Follows";
import EditPage from "../page/EdifPage";
import LikeArticle from "../page/LikeArticles";
import OtherPage from "../page/OtherPage"; 
import WriteArticle from "../page/WriteArticle";
import Comment from "../page/Comment";
import Register from "../page/Register";


const routes = [
    {
        path: "/",
        exact: true,
        render: () => <Redirect to="/login" />
    },
    {
        path: "/login",
        exact: true,
        component: Login
    },
    {
        path: "/register",
        exact: true,
        component: Register,
    },
    {
        path: "/tabbar",
        component: Tabbar,
        routes: [
            {
                path: "/tabbar",
                exact: true,
                render: () => <Redirect to="/tabbar/home" />
            },
            {
                path: "/tabbar/home",
                exact: true,
                component: HomePage,
            },
            {
                path: "/tabbar/message",
                exact: true,
                component: Message,
            },
            {
                path: "/tabbar/me",
                exact: true,
                component: PersonalCenter, 
            },
        ]
    },
    // 我的消息
    {
        path: "/message/detail/:receiverId",
        exact: true,
        component: ChatRecord,
    },
    {
        path: "/message/fans",
        exact: true,
        component: Fans,
        content: '新增关注',
    },
    {
        path: "/message/like",
        component: BeLiked
    },
    {
        path: "/message/chat",
        exact: true,
        component: Follows,
        content: '发私信',
        style: 'none',
    },
    // 个人中心
    {
        path: "/person/fans",
        exact: true,
        component: Fans,
        content: '粉丝',
    },
    {
        path: "/person/follows",
        exact: true,
        component: Follows,
        content: '关注的人'
    },
    {
        path: "/person/edit",
        exact: true,
        component: EditPage
    },
    {
        path: "/person/like",
        exact: true,
        component: LikeArticle,
    },
    {
        path: "/person/comment",
        exact: true,
        component: Comment,
    },
    {
        path: "/other/page/:userId",
        exact: true,
        component: OtherPage
    },
    {
        path: "/search",
        exact: true,
        component: Search,
    },
    {
        path: "/search/:keyWord",
        exact: true,
        component: Search,
    },
    {
        path: "/post/detail/:articleId",
        exact: true,
        component: PostDetail,
    },
    {
        path: "/article/post",
        exact: true,
        component: WriteArticle,
    },
    
]

export default routes;