import Page from "./Page";
import List from "./List";
import Image from "./Image";
import Grid from "./Grid";
import structures from "../compiled/structuresImports.js";

export interface Props {
	kind: string;
	title?: string;
	content?: string;
	childElements?: [Props];
	meta?: any;
	image?: any;
	attributes?: {
		id?: string;
		class?: string;
	}
}

const Element = (props) => {
	// console.log(props.id, props.type);

	const elementChildren =
		props.childElements && props.childElements[0]
		&& props.childElements.map((props) => {
			return <Element {...props} />
		});

	const children = elementChildren || props.content;
	switch (props.kind) {
		case "div":
			return <div {...props.attributes} children={children} />;
		case "section":
			return <section {...props.attributes} children={children} />;
		case "a":
			return <a {...props.attributes} children={children} />;
		case "page":
			return <Page {...props} />;
		case "list":
			return <List {...props} />;
		case "image":
			return <Image {...props} />;
		case "grid":
			return <Grid {...props} />;
		default:
			for (const element of structures) {
				const { structure, meta } = element;
				if (props.kind == meta.filename)
					return <Element {...structure} />
			}
			break;
		// return <Element {...headerLayout} />;
	}
	return <span>error: kind "{props.kind}" not supported</span>;
}

export default Element;
