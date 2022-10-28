import Element from "./Element";
// import "./page.css";

const Page = (props) => {
   return <main {...props.attributes} >
      {/* <h1>Welcome to <span class="text-gradient">{props.title}</span></h1> */}
      {props.childElements.map((props) => <Element {...props} />)}
   </main>
}

export default Page;