import Element from "./Element";
import images from "../compiled/imagesImports.js";

const data = { images };
// console.log(images);
const Grid = (props) => {

   const children = props.childElements
      ? props.childElements.map((props) => <Element {...props} />)
      : data[props.data].map((content) => {
         const elementProps = { ...content, ...props.element };
         return <li><Element {...elementProps} /></li>
      });

   return <div id="Grid" {...props.attributes} >
      {children}
   </div>
}

export default Grid;