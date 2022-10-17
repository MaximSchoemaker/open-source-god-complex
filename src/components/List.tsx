import Element from "./Element";
import images from "../compiled/imagesImports.js";

const data = { images };
// console.log(images);
const List = (props) => {

   const list = props.childElements
      ? props.childElements.map((props) => <li><Element {...props} /></li>)
      : data[props.data].map((content) => {
         const elementProps = { ...content, ...props.element };
         return <li><Element {...elementProps} /></li>
      });

   return <ul {...props.attributes} >
      {list}
   </ul>
}

export default List;