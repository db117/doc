const head = [
    ['link', {rel: 'icon', href: '/favicon.ico'}],
    ['script', {}, `
            var _hmt = _hmt || [];
            (function() {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?32d81e1cc669a3aef7da8deccdd959ef";
            var s = document.getElementsByTagName("script")[0]; 
            s.parentNode.insertBefore(hm, s);
            })();
        `]
];

export default head