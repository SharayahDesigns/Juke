const isMobile = () => {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };
  
  export default isMobile;
  