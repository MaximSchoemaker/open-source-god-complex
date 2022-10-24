const Image = (props) => {
   return <img
      loading="lazy"
      src={props.src}
      // alt={props.filename + props.extension}
      alt={`path: ${props.path}\n\nsrc: ${props.src}`}
      // onError={function (evt) { evt.target.style.display = "none" }}

      {...props.attributes}
   />
}

export default Image;