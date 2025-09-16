import Airtel from '../assets/Airtel.svg';
import Amazon from '../assets/Amazon.svg';
import BCG from '../assets/BCG.svg';
import Cred from '../assets/Cred.svg';
import Intel from '../assets/Intel.svg';
const Logo = ({ name, size = 16 }) => {
    const logos = {
        Airtel: Airtel,
        Amazon: Amazon,
        BCG: BCG,
        Cred: Cred,
        Intel: Intel
    };
  return (
    <img src={logos[name]} style={{ width: `${size}px`, height: `${size}px`, marginLeft: `${size}px` }} />
  );
};

export default Logo;