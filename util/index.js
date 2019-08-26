const utils = {
    genSidebar: function (title, children = [''], collapsable = true, sidebarDepth = 2) {
        var arr = [];
        arr.push({
            title,
            collapsable,
            sidebarDepth,
            children
        });
        return arr;
    }
};

module.exports = utils;