# Formula Builder API Testing Guide

## Base URL
```
http://localhost:5000
```

## Authentication Headers
After login, include this header in authenticated requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. USER AUTHENTICATION ENDPOINTS

### 1.1 Register New User
**POST** `/api/users/register`

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  }
}
```

### 1.2 Login User
**POST** `/api/users/login`

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 Google Sign-In
**POST** `/api/users/google-signin`

```json
{
  "firebaseUid": "google_uid_123456789",
  "email": "user@gmail.com",
  "name": "Google User",
  "photoURL": "https://lh3.googleusercontent.com/a/default-user=s96-c"
}
```

### 1.4 Get Current User
**GET** `/api/users/me`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "64f8a1b2c3d4e5f6g7h8i9j0",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "avatar": "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1",
    "emailVerified": false,
    "role": "user"
  }
}
```

### 1.5 Refresh Token
**POST** `/api/users/refresh-token`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.6 Forgot Password
**POST** `/api/users/forgot-password`

```json
{
  "email": "john.doe@example.com"
}
```

### 1.7 Reset Password
**POST** `/api/users/reset-password`

```json
{
  "token": "reset_token_from_forgot_password_response",
  "password": "newPassword123"
}
```

---

## 2. FORM MANAGEMENT ENDPOINTS

### 2.1 Create New Form
**POST** `/api/forms`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

```json
{
  "title": "Customer Feedback Survey",
  "fields": [
    {
      "id": "customer_name",
      "type": "text",
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "required": true
    },
    {
      "id": "customer_email",
      "type": "email",
      "label": "Email Address",
      "placeholder": "Enter your email",
      "required": true
    },
    {
      "id": "rating",
      "type": "radio",
      "label": "How would you rate our service?",
      "required": true,
      "options": ["Excellent", "Good", "Average", "Poor"]
    },
    {
      "id": "feedback",
      "type": "textarea",
      "label": "Additional Comments",
      "placeholder": "Please share your feedback...",
      "required": false
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Form created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
    "title": "Customer Feedback Survey",
    "fields": [
      {
        "id": "customer_name",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "required": true
      }
    ],
    "createdBy": "64f8a1b2c3d4e5f6g7h8i9j0",
    "status": "draft",
    "responses": [],
    "views": 0,
    "createdAt": "2024-08-18T19:26:08.000Z",
    "updatedAt": "2024-08-18T19:26:08.000Z"
  }
}
```

### 2.2 Get All Forms (with Pagination & Filtering)
**GET** `/api/forms?page=1&limit=10&status=all&search=&sortBy=updatedAt&sortOrder=desc`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Forms retrieved successfully",
  "data": {
    "forms": [
      {
        "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
        "title": "Customer Feedback Survey",
        "status": "draft",
        "responseCount": 0,
        "fieldCount": 4,
        "lastResponseAt": null,
        "createdAt": "2024-08-18T19:26:08.000Z",
        "updatedAt": "2024-08-18T19:26:08.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "filters": {
      "status": "all",
      "search": "",
      "sortBy": "updatedAt",
      "sortOrder": "desc"
    }
  }
}
```

### 2.3 Get Single Form by ID
**GET** `/api/forms/64f8a1b2c3d4e5f6g7h8i9j1`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Form retrieved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
    "title": "Customer Feedback Survey",
    "fields": [
      {
        "id": "customer_name",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "required": true
      }
    ],
    "status": "draft",
    "responseCount": 0,
    "fieldCount": 4,
    "requiredFieldCount": 2,
    "isPublished": false,
    "isDraft": true,
    "isClosed": false,
    "daysSinceCreated": 0,
    "daysSinceUpdated": 0,
    "responseRate": null,
    "fieldTypeBreakdown": {
      "text": 1,
      "email": 1,
      "radio": 1,
      "textarea": 1
    },
    "recentResponses": []
  }
}
```

### 2.4 Update Form
**PUT** `/api/forms/64f8a1b2c3d4e5f6g7h8i9j1`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

```json
{
  "title": "Updated Customer Feedback Survey",
  "status": "published",
  "fields": [
    {
      "id": "customer_name",
      "type": "text",
      "label": "Full Name",
      "placeholder": "Enter your full name",
      "required": true
    },
    {
      "id": "customer_email",
      "type": "email",
      "label": "Email Address",
      "placeholder": "Enter your email",
      "required": true
    },
    {
      "id": "satisfaction",
      "type": "select",
      "label": "Satisfaction Level",
      "required": true,
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      "id": "recommend",
      "type": "checkbox",
      "label": "Would you recommend us to others?",
      "required": false,
      "options": ["Yes, definitely", "Maybe", "No"]
    }
  ]
}
```

### 2.5 Delete Form
**DELETE** `/api/forms/64f8a1b2c3d4e5f6g7h8i9j1`
Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Response:**
```json
{
  "success": true,
  "message": "Form deleted successfully"
}
```

---

## 3. PUBLIC FORM ENDPOINTS (No Authentication Required)

### 3.1 Get Public Form
**GET** `/api/forms/public/64f8a1b2c3d4e5f6g7h8i9j1`

**Expected Response:**
```json
{
  "success": true,
  "message": "Form retrieved successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6g7h8i9j1",
    "title": "Customer Feedback Survey",
    "fields": [
      {
        "id": "customer_name",
        "type": "text",
        "label": "Full Name",
        "placeholder": "Enter your full name",
        "required": true
      }
    ],
    "status": "published",
    "views": 15
  }
}
```

### 3.2 Submit Form Response
**POST** `/api/forms/64f8a1b2c3d4e5f6g7h8i9j1/submit`

```json
{
  "customer_name": "Jane Smith",
  "customer_email": "jane.smith@example.com",
  "satisfaction": "Very Satisfied",
  "recommend": ["Yes, definitely"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Response submitted successfully",
  "data": {
    "responseId": "1692378368000",
    "submittedAt": "2024-08-18T19:26:08.000Z"
  }
}
```

---

## 4. SAMPLE TEST DATA

### Complex Form Example
```json
{
  "title": "Event Registration Form",
  "fields": [
    {
      "id": "participant_name",
      "type": "text",
      "label": "Participant Name",
      "placeholder": "Enter full name",
      "required": true
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email Address",
      "required": true
    },
    {
      "id": "phone",
      "type": "phone",
      "label": "Phone Number",
      "placeholder": "+1 (555) 123-4567",
      "required": true
    },
    {
      "id": "event_date",
      "type": "date",
      "label": "Preferred Event Date",
      "required": true
    },
    {
      "id": "session_time",
      "type": "time",
      "label": "Preferred Session Time",
      "required": false
    },
    {
      "id": "experience_level",
      "type": "select",
      "label": "Experience Level",
      "required": true,
      "options": ["Beginner", "Intermediate", "Advanced", "Expert"]
    },
    {
      "id": "interests",
      "type": "checkbox",
      "label": "Areas of Interest",
      "required": false,
      "options": ["Technology", "Marketing", "Design", "Business", "Finance"]
    },
    {
      "id": "dietary_restrictions",
      "type": "textarea",
      "label": "Dietary Restrictions/Special Needs",
      "placeholder": "Please specify any dietary restrictions or special accommodations needed...",
      "required": false
    },
    {
      "id": "rating_expectations",
      "type": "rating",
      "label": "Rate your expectations for this event (1-5)",
      "required": false
    },
    {
      "id": "resume",
      "type": "file",
      "label": "Upload Resume (Optional)",
      "required": false
    },
    {
      "id": "address",
      "type": "address",
      "label": "Mailing Address",
      "required": false
    }
  ]
}
```

### Multiple Form Response Examples
```json
{
  "participant_name": "Alice Johnson",
  "email": "alice.johnson@example.com",
  "phone": "+1-555-123-4567",
  "event_date": "2024-09-15",
  "session_time": "14:30",
  "experience_level": "Intermediate",
  "interests": ["Technology", "Design"],
  "dietary_restrictions": "Vegetarian, no nuts",
  "rating_expectations": "4"
}
```

---

## 5. CURL COMMANDS FOR TESTING

### Register User
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Create Form (Replace YOUR_TOKEN with actual JWT token)
```bash
curl -X POST http://localhost:5000/api/forms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Form",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Name",
        "required": true
      }
    ]
  }'
```

### Get All Forms
```bash
curl -X GET "http://localhost:5000/api/forms?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Submit Form Response (Replace FORM_ID with actual form ID)
```bash
curl -X POST http://localhost:5000/api/forms/FORM_ID/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Response"
  }'
```

---

## 6. ERROR RESPONSES

### Validation Error Example
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### Authentication Error
```json
{
  "message": "Access denied. No token provided"
}
```

### Not Found Error
```json
{
  "success": false,
  "message": "Form not found"
}
```

---

## 7. TESTING CHECKLIST

- [ ] User registration with valid data
- [ ] User registration with invalid data (short password, invalid email)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials
- [ ] Access protected routes without token
- [ ] Access protected routes with valid token
- [ ] Create form with all field types
- [ ] Create form with missing required fields
- [ ] Get all forms with different pagination parameters
- [ ] Update form status from draft to published
- [ ] Delete form as owner
- [ ] Try to access another user's form
- [ ] Submit response to published form
- [ ] Submit response to unpublished form
- [ ] Submit response with missing required fields
- [ ] Get public form that doesn't exist

## 8. POSTMAN COLLECTION

You can import these examples into Postman by creating a new collection and adding each endpoint with the respective JSON data and headers.
