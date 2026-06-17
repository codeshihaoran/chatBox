import { marked } from "marked";
import hljs from "../highlight";

export const useMarked = () => {
    const startMarked = async (content: string) => {
        const markResponse = await marked(content);
        const parser = new DOMParser();
        const doc = parser.parseFromString(markResponse, 'text/html');
        const codeBlocks = doc.querySelectorAll('pre > code');
        // 遍历所有链接，将图片链接替换为 <img> 标签
        const aElements = doc.querySelectorAll("a")
        aElements.forEach(aElement => {
            const link = aElement.href
            // 判断是否为常见图片格式链接
            if (/\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i.test(link)) {
                const imgElement = doc.createElement("img")
                imgElement.src = link
                imgElement.classList.add('generate-img')
                aElement.parentNode?.replaceChild(imgElement, aElement)
            }
        })
        codeBlocks.forEach((block) => {
            const codeContent = block.textContent || '';
            const languageMatch = block.className.match(/language-(\w+)/);
            const language = languageMatch ? languageMatch[1] : 'plaintext'
            const highlightedCode = hljs.highlight(codeContent, { language }).value;

            // 代码块 language 和 copy 按钮
            const blockTopStyle = document.createElement("div")
            blockTopStyle.setAttribute('class', 'hljs-div')

            const blockSpan = document.createElement('span')
            blockSpan.textContent = language
            blockSpan.setAttribute('class', 'hljs-span')

            const blockBtn = document.createElement("button")
            blockBtn.setAttribute('class', 'hljs-btn')
            blockBtn.textContent = '复制'

            blockTopStyle.appendChild(blockSpan)
            blockTopStyle.appendChild(blockBtn)

            block.innerHTML = highlightedCode

            let firstChild = block.firstChild
            if (firstChild) {
                block.insertBefore(blockTopStyle, firstChild)
            }

            block.classList.add('hljs')
        });
        return doc.body.innerHTML
    }
    return startMarked
}
