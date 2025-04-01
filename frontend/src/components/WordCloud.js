import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import cloud from "d3-cloud";

const WordCloudComponent = ({ data }) => {
    const ref = useRef();

    useEffect(() => {
        if (data.length === 0) return;

        // 设置画布大小
        const width = 800;
        const height = 400;

        // 创建词云布局
        const layout = cloud()
            .size([width, height]) // 设置词云的宽度和高度
            .words(data.map((d) => ({ text: d.text, size: d.value }))) // 数据格式化为 {text, size}
            .padding(5) // 单词之间的间距
            .rotate(() => ~~(Math.random() * 2) * 90) // 随机旋转角度（0 或 90）
            .fontSize((d) => d.size) // 字体大小由数据中的值决定
            .on("end", draw); // 布局完成后调用 draw 函数

        // 开始布局计算
        layout.start();

        // 绘制词云
        function draw(words) {
            d3.select(ref.current)
                .selectAll("*")
                .remove(); // 清空之前的 SVG 内容

            d3.select(ref.current)
                .append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`) // 居中显示
                .selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", (d) => `${d.size}px`) // 设置字体大小
                .style("fill", (d) => d3.schemeCategory10[Math.floor(Math.random() * 10)]) // 随机颜色
                .style("font-family", "Impact") // 设置字体
                .attr("text-anchor", "middle") // 文本居中对齐
                .attr("transform", (d) => `translate(${[d.x, d.y]})rotate(${d.rotate})`) // 位置和旋转
                .text((d) => d.text); // 设置文本内容
        }
    }, [data]);

    return <svg ref={ref} width={800} height={400}></svg>;
};

export default WordCloudComponent;