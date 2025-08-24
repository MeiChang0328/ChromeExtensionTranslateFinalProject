# Gemini Code Assistant Context

This file provides context for the Gemini code assistant to understand the project structure and conventions.

## Project Overview

This project consists of two main parts:

*   **WordSnap**: A browser extension built with Vue.js and Vite. It allows users to save words they encounter on the web.
*   **WordVault**: A Spring Boot backend application that provides a RESTful API to store and manage the words saved by WordSnap.

## WordSnap (Browser Extension)

WordSnap is a frontend application that runs in the user's browser.

### Building and Running

*   **Install dependencies**: `npm install`
*   **Run in development mode (with hot-reload)**: `npm run dev`
*   **Build for production**: `npm run build`

### Development Conventions

*   The project uses Vue 3 with the Composition API.
*   Code is written in JavaScript.
*   Vite is used for the build tooling.

## WordVault (Backend API)

WordVault is a Java-based backend that serves as the API for WordSnap.

### Building and Running

*   **Run the application**: `mvn spring-boot:run`
*   **Build the application**: `mvn package`

### Development Conventions

*   The project is built with Spring Boot and Maven.
*   It uses Java 21.
*   Spring Data JPA is used for database interaction with a MariaDB database.
*   RESTful APIs are documented using OpenAPI (Swagger).
*   Lombok is used to reduce boilerplate code.
