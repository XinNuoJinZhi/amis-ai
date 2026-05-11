import { Graph } from "@antv/x6"
import { RefObject } from "react"
import { saveEntityDiagramPosition } from "@/api/entitymanage";

const registerTooltip = (container: Element, text: string) => {
    let tooltip: HTMLElement | null = null;
    let content: HTMLElement | null = null;

    const handleMouseEnter = (e: MouseEvent) => {
        if (!tooltip) tooltip = document.querySelector('.x6-tooltip') as HTMLElement;
        if (!content) content = tooltip?.querySelector('.ant-tooltip-inner') as HTMLElement;
        tooltip.style.pointerEvents = 'none';
        if (content) {
            content.innerText = text;
            tooltip.style.left = `${e.clientX - content.offsetWidth / 2}px`;
            tooltip.style.top = `${e.clientY}px`;
            tooltip.style.display = 'block';
        }
    };

    const handleMouseLeave = (e: any) => {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
};

export function graph(entity_diagram_wrap: RefObject<HTMLDivElement>, miniMap: RefObject<HTMLDivElement>) {
    const graph = new Graph({
        container: entity_diagram_wrap.current!,
        grid: { visible: true },
        scroller: {
            enabled: true,
            pageVisible: false,
            pageBreak: false,
            pannable: true,
            padding: 0,
        },
        minimap: {
            enabled: true,
            container: miniMap.current!,
            width: 200,
            height: 160,
            // padding: 10,
        },
        connecting: {
            router: {
                name: 'er',
                args: {
                    offset: 25,
                    direction: 'H',
                }
            },
            connector: {
                name: 'rounded',
                args: {
                    radius: 8
                }
            },
        },
        mousewheel: {
            enabled: true, // 是否开启滚轮缩放交互
            maxScale: 4,
            minScale: 0.2,
            modifiers: 'ctrl',
        },
        onPortRendered({ contentContainer, port, node }) {
            if (port.group == 'tableTitlePosition') {
                const nodeView = graph.findViewByCell(node)
                const text = (node.data as any).tip
                registerTooltip(nodeView?.container.childNodes[0], text)
                registerTooltip(nodeView?.container.childNodes[1], text)
                return;
            }
            const text = node.portProp(port.id, 'tip') as string
            registerTooltip(contentContainer, text)
        },
    })

    //移动节点后触发
    graph.on('node:moved', async ({ e, x, y, node, view }) => {
        let id = node.id;
        let params = [{
            id,
            x,
            y
        }]
        await saveEntityDiagramPosition(params)
    })

    return graph
}