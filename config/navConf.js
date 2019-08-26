module.exports = [
    {text: 'Home', link: '/'},
    {text: 'java', link: '/java/'},
    {
        text: '系统', items: [
            {text: 'Linux', link: '/os/linux/'},
            {text: 'Windows', link: '/os/windows/'},
            {text: 'CentOS', link: '/os/centos/'},
            {text: 'Ubuntu', link: '/os/ubuntu/'},
        ]
    },
    {
        text: '数据库', items: [
            {text: 'mysql', link: '/database/mysql/'},
            {text: 'redis', link: '/database/redis/'},
        ]
    },
    {
        text: '开发工具', items: [
            {text: 'Git', link: '/util/git/'},
            {text: 'nginx', link: '/util/nginx/'},
        ]
    },
    {text: 'docker', link: '/docker/'},
    {text: 'other', link: '/other/'},
    {
        text: '更多', items: [
            {text: 'VuePress1.x 官网', link: 'https://v1.vuepress.vuejs.org/zh/'},
        ]
    }
];