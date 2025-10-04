import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Typography,
  useTheme,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "state";
import Dropzone from "react-dropzone";
import FlexBetween from "components/FlexBetween";

const registerSchema = yup.object().shape({
  firstName: yup.string().required("required"),
  lastName: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
  location: yup.string().required("required"),
  occupation: yup.string().required("required"),
  picture: yup.string().required("required"),
  // NEW: Optional social media links
  twitter: yup.string().url("Must be a valid URL").nullable(),
  linkedin: yup.string().url("Must be a valid URL").nullable(),
  instagram: yup.string().url("Must be a valid URL").nullable(),
});

const loginSchema = yup.object().shape({
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
});

const initialValuesRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  occupation: "",
  picture: "",
};

const initialValuesLogin = {
  email: "",
  password: "",
};

const Form = () => {
  const [pageType, setPageType] = useState("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  // FIXED: Hardcode API URL to avoid environment variable issues
  const API_URL = "https://getsocialnow.onrender.com";

  const register = async (values, onSubmitProps) => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Starting registration...");
      
      const formData = new FormData();
      for (let value in values) {
        formData.append(value, values[value]);
      }
      formData.append("picturePath", values.picture.name);

      console.log("Sending registration request to:", `${API_URL}/auth/register`);

      const savedUserResponse = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });
      
      console.log("Registration response status:", savedUserResponse.status);
      
      if (!savedUserResponse.ok) {
        const errorText = await savedUserResponse.text();
        console.error("Registration failed:", errorText);
        throw new Error(`Registration failed: ${savedUserResponse.status} ${savedUserResponse.statusText}`);
      }
      
      const savedUser = await savedUserResponse.json();
      console.log("Registration successful:", savedUser);
      
      onSubmitProps.resetForm();

      if (savedUser) {
        setPageType("login");
        setError("Registration successful! Please login.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (values, onSubmitProps) => {
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Starting login...");
      console.log("Sending login request to:", `${API_URL}/auth/login`);

      const loggedInResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(values),
      });

      console.log("Login response status:", loggedInResponse.status);

      if (!loggedInResponse.ok) {
        const errorText = await loggedInResponse.text();
        console.error("Login failed:", errorText);
        throw new Error(`Login failed: ${loggedInResponse.status} ${loggedInResponse.statusText}`);
      }

      const loggedIn = await loggedInResponse.json();
      console.log("Login successful:", loggedIn);
      
      onSubmitProps.resetForm();
      
      if (loggedIn && loggedIn.user && loggedIn.token) {
        dispatch(
          setLogin({
            user: loggedIn.user,
            token: loggedIn.token,
          })
        );
        console.log("Navigating to home...");
        navigate("/home");
      } else {
        throw new Error("Invalid login response format");
      }
    } catch (error) {
      console.error("Login Error:", error);
      setError(`Login failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    console.log("Form submitted:", { isLogin, values: { ...values, password: "***" } });
    
    if (isLogin) await login(values, onSubmitProps);
    if (isRegister) await register(values, onSubmitProps);
  };

  // Add component error boundary
  const handleError = (error) => {
    console.error("Form component error:", error);
    setError(`Component error: ${error.message}`);
  };

  try {
    return (
      <Box>
        {/* Display error messages */}
        {error && (
          <Box 
            sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: error.includes("successful") ? "#d4edda" : "#f8d7da",
              color: error.includes("successful") ? "#155724" : "#721c24",
              borderRadius: "4px",
              border: `1px solid ${error.includes("successful") ? "#c3e6cb" : "#f5c6cb"}`
            }}
          >
            <Typography>{error}</Typography>
          </Box>
        )}

        <Formik
          onSubmit={handleFormSubmit}
          initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
          validationSchema={isLogin ? loginSchema : registerSchema}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
            setFieldValue,
            resetForm,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap="30px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
                {isRegister && (
                  <>
                    <TextField
                      label="First Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.firstName}
                      name="firstName"
                      error={Boolean(touched.firstName) && Boolean(errors.firstName)}
                      helperText={touched.firstName && errors.firstName}
                      sx={{ gridColumn: "span 2" }}
                      disabled={isLoading}
                    />
                    <TextField
                      label="Last Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.lastName}
                      name="lastName"
                      error={Boolean(touched.lastName) && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                      sx={{ gridColumn: "span 2" }}
                      disabled={isLoading}
                    />
                    <TextField
                      label="Location"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.location}
                      name="location"
                      error={Boolean(touched.location) && Boolean(errors.location)}
                      helperText={touched.location && errors.location}
                      sx={{ gridColumn: "span 4" }}
                      disabled={isLoading}
                    />
                    <TextField
                      label="Occupation"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.occupation}
                      name="occupation"
                      error={Boolean(touched.occupation) && Boolean(errors.occupation)}
                      helperText={touched.occupation && errors.occupation}
                      sx={{ gridColumn: "span 4" }}
                      disabled={isLoading}
                    />
                    <Box
                      gridColumn="span 4"
                      border={`1px solid ${palette.neutral.medium}`}
                      borderRadius="5px"
                      p="1rem"
                    >
                      <Dropzone
                        acceptedFiles=".jpg,.jpeg,.png,.gif,.webp"
                        multiple={false}
                        onDrop={(acceptedFiles) =>
                          setFieldValue("picture", acceptedFiles[0])
                        }
                        disabled={isLoading}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <Box
                            {...getRootProps()}
                            border={`2px dashed ${palette.primary.main}`}
                            p="1rem"
                            sx={{ 
                              "&:hover": { cursor: isLoading ? "not-allowed" : "pointer" },
                              opacity: isLoading ? 0.5 : 1
                            }}
                          >
                            <input {...getInputProps()} />
                            {!values.picture ? (
                              <p>Add Picture Here</p>
                            ) : (
                              <FlexBetween>
                                <Typography>{values.picture.name}</Typography>
                                <EditOutlinedIcon />
                              </FlexBetween>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Box>
                  </>
                )}

                <TextField
                  label="Email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email}
                  name="email"
                  error={Boolean(touched.email) && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ gridColumn: "span 4" }}
                  disabled={isLoading}
                />
                <TextField
                  label="Password"
                  type="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password}
                  name="password"
                  error={Boolean(touched.password) && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                  disabled={isLoading}
                />
              </Box>

              {/* BUTTONS */}
              <Box>
                <Button
                  fullWidth
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    m: "2rem 0",
                    p: "1rem",
                    backgroundColor: palette.primary.main,
                    color: palette.background.alt,
                    "&:hover": { color: palette.primary.main },
                    "&:disabled": {
                      backgroundColor: palette.neutral.light,
                      color: palette.neutral.medium,
                    },
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? "PLEASE WAIT..." : (isLogin ? "LOGIN" : "REGISTER")}
                </Button>
                <Typography
                  onClick={() => {
                    if (!isLoading) {
                      setPageType(isLogin ? "register" : "login");
                      resetForm();
                      setError("");
                    }
                  }}
                  sx={{
                    textDecoration: "underline",
                    color: palette.primary.main,
                    "&:hover": {
                      cursor: isLoading ? "not-allowed" : "pointer",
                      color: isLoading ? palette.primary.main : palette.primary.light,
                    },
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {isLogin
                    ? "Don't have an account? Sign Up here."
                    : "Already have an account? Login here."}
                </Typography>
              </Box>
            </form>
          )}
        </Formik>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, p: 1, backgroundColor: '#f0f0f0', fontSize: '0.8rem' }}>
            <Typography variant="caption">
              Debug: API_URL = {API_URL}
            </Typography>
          </Box>
        )}
      </Box>
    );
  } catch (componentError) {
    handleError(componentError);
    return (
      <Box sx={{ p: 2, color: 'red' }}>
        <Typography>Error loading form. Please refresh the page.</Typography>
        <Typography variant="caption">{componentError.message}</Typography>
      </Box>
    );
  }
};

export default Form;