const Card = ({ children, className = "", onClick }) => {
  return (
    <div className={`${className} p-6 rounded-lg border`} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;
