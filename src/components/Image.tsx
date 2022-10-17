const Image = (props) => {
   return <img src={props.src} {...(props.attributes ?? [])} />
}

export default Image;