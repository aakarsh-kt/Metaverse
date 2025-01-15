import { useState } from "react";
import Navbar from "../components/navbar";

const Register = () => {

  interface RadioOption {
    value: string;
    label: string;
  }

  const options: RadioOption[] = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },

  ];
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  async function handleSubmit() {
    event?.preventDefault();
    interface Payload {
      username: string;
      password: string;
      type: string;
    }
    const payload: Payload = {
      "username": username,
      "password": password,
      "type": selectedValue
    }
    console.log(payload);
    const res = await fetch(`http://localhost:3000/api/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)

    })
    console.log(res.body);

  }
  return (
    <div className="flex flex-col items-center bg-red-700 h-screen w-screen ">
      <Navbar />
      Register
      <div className="flex flex-col m-2 p-2">
        <form className="flex flex-col">
          <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <div className="items-center flex flex-col" >
            <div>
              {options.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    value={option.value}
                    checked={selectedValue === option.value}
                    onChange={handleChange}
                  />
                  {option.label}
                </label>
              ))}
            </div>

            </div>

          <button type="submit" onClick={handleSubmit}>Submit</button>
        </form>

      </div>
    </div>
  )
}

export default Register;