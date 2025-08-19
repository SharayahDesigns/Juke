import React, { useState, useEffect } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { ref, set } from 'firebase/database';
import { db } from '../firebase'; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from "sweetalert2";
import swalBaseOptions from "../utils/SwalOptions";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/create-room');
    } catch (err) {
      setError(err.message);
    }
  };
  

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(""); // clear any previous error
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      console.log("Account created and username set");
    //   await sendEmailVerification(userCredential.user);
      await sendEmailVerification(userCredential.user);
        Swal.fire({
            ...swalBaseOptions,
        icon: 'success',
        title: 'Verification Sent',
        text: 'Please check your email and verify your account before signing in.',
        });
        await auth.signOut(); // Sign them out after signup and sending email


    } catch (err) {
        let message = "Failed to create account.";
        if (err.code === 'auth/email-already-in-use') {
          message = "That email is already in use. Try signing in instead.";
        } else if (err.code === 'auth/invalid-email') {
          message = "Please enter a valid email address.";
        } else if (err.code === 'auth/weak-password') {
          message = "Password should be at least 6 characters.";
        }
      
        Swal.fire({
            ...swalBaseOptions,
          icon: 'error',
          title: 'Oops!',
          text: message,
        });
      }
  };
  
  const handleGoogleSignIn = async () => {
    // const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
    
      const userRef = ref(db, `users/${user.uid}`);
      const safePhotoURL = user.providerData[0]?.photoURL || "";
  
      // Set user data
      await set(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: safePhotoURL,
      });
      navigate('/create-room');
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.emailVerified) {
            navigate('/');
          } else {
            setError("Email not verified yet. Please Check your inbox.")
          }
          
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  return (
    <div className="sign-in-container">
      <div className="juke-title-box mb-1">
        <h1 className="">
         
          <span className="juke-title">Sign In</span>
        </h1>
      </div>
      <div className="signin-main">
        <div className="signInCard pt-2">
            
          {isSignUp ? (
            <form className="signIn-Form" onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: "40px" }} // Make space for icon
              />
{error && <p className="RedError" style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}

           
              <button type="submit">Create Account</button>
              <p className="createAccount" onClick={() => setIsSignUp(false)}>
                Already have an account? Sign in
              </p>
            </form>
          ) : (
            <>
              <form className="signIn-Form" onSubmit={handleEmailSignIn}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit">Sign In</button>
              </form>

              <button
                className="googleBtn"
                onClick={handleGoogleSignIn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  padding: "0.6rem 1rem",
                  borderRadius: "4px",
                  fontWeight: "400",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: "black",
                  justifyContent: "center",
                }}
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google"
                  style={{
                    width: "20px",
                    height: "20px",
                    marginRight: "10px",
                    color: "black",
                  }}
                />
                Sign in with Google
              </button>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div className="createAccount">
                <p onClick={() => setIsSignUp(true)}>Create Account</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
