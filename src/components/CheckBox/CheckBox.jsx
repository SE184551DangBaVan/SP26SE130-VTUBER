import './CheckBox.css' 

const Checkbox = () => {

    return (
      <label className="checkbox-container">
        <input type="checkbox" />
        <div className="checkmark"></div>
      </label>
    );
}

export default Checkbox;