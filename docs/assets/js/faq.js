(function () {
    var SECTION_TITLES = {
        "面试官深挖": true,
        "高频追问": true
    };

    function headingText(el) {
        return (el.textContent || "").replace(/#/g, "").replace(/\s+/g, " ").trim();
    }

    function chevron() {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "faq-chev");
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("aria-hidden", "true");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M5 7.5 L10 12.5 L15 7.5");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "currentColor");
        path.setAttribute("stroke-width", "1.6");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-linejoin", "round");
        svg.appendChild(path);
        return svg;
    }

    function buildItem(index, group) {
        var item = document.createElement("details");
        item.className = "faq-item";

        var summary = document.createElement("summary");
        var num = document.createElement("span");
        num.className = "faq-num";
        num.textContent = String(index + 1).padStart(2, "0");
        var q = document.createElement("span");
        q.className = "faq-q";
        q.textContent = group.title;
        summary.appendChild(num);
        summary.appendChild(q);
        summary.appendChild(chevron());

        var body = document.createElement("div");
        body.className = "faq-a";
        group.body.forEach(function (node) {
            body.appendChild(node);
        });

        item.appendChild(summary);
        item.appendChild(body);
        return item;
    }

    function enhance(root) {
        var headings = root.querySelectorAll("h2");
        for (var i = 0; i < headings.length; i++) {
            var h2 = headings[i];
            if (!SECTION_TITLES[headingText(h2)]) continue;
            if (h2.getAttribute("data-faq") === "ready") continue;

            var nodes = [];
            var node = h2.nextElementSibling;
            while (node && node.tagName !== "H2") {
                nodes.push(node);
                node = node.nextElementSibling;
            }

            var groups = [];
            var current = null;
            nodes.forEach(function (el) {
                if (el.tagName === "H3") {
                    current = { title: headingText(el), body: [] };
                    groups.push(current);
                    el.remove();
                } else if (current) {
                    current.body.push(el);
                }
            });
            if (!groups.length) continue;

            var list = document.createElement("div");
            list.className = "faq-list";
            groups.forEach(function (group, index) {
                list.appendChild(buildItem(index, group));
            });

            var after = h2;
            for (var j = 0; j < nodes.length; j++) {
                if (nodes[j].tagName === "H3") break;
                if (nodes[j].isConnected) after = nodes[j];
            }
            after.insertAdjacentElement("afterend", list);
            h2.setAttribute("data-faq", "ready");
        }
    }

    window.$docsify = window.$docsify || {};
    window.$docsify.plugins = window.$docsify.plugins || [];
    window.$docsify.plugins.push(function (hook) {
        hook.doneEach(function () {
            var root = document.querySelector(".markdown-section");
            if (root) enhance(root);
        });
    });
})();
