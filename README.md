# Just API Doc

A modern and user-friendly API documentation platform. Manage, and share your API documentation with ease.

## Features

- Import API documentation from OpenAPI 3.0 JSON
- Support for JSON URL or JSON string
- Customizable logo and appearance
- Advanced access control
  - Public/Private documentation
  - Access code protection
  - Custom sharing URLs
- Multi-user support
- Responsive design

## Technologies

- [Next.js 14](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Prisma](https://www.prisma.io/) - ORM
- [PostgreSQL](https://www.postgresql.org/) - Database
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React](https://reactjs.org/) - UI Library

## Installation

1. Clone the repository:

```bash
git clone https://github.com/cihanTAYLAN/just-api-doc.git
cd just-api-doc
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/just_api_doc"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database schema:

```bash
npx prisma generate
npx prisma db push
```

5. Start the application:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Register or log in
2. Click "Create New" in the dashboard
3. For your API documentation:
   - Set a name
   - Enter JSON URL or enter JSON string
   - Add logo (optional)
   - Configure access settings
4. Share or edit your documentation

## Access Control

- **Public**: Anyone can view
- **Private**: Only you can view
- **Protected**: Protected with access code

## Screenshots

Here are some screenshots showcasing the platform's interface and features:

### Register & Login Page

<img src="https://raw.githubusercontent.com/CihanTAYLAN/just-api-doc/refs/heads/main/screen-images/register.png" alt="Register and Login Page" />

### Empty Dashboard

<img src="https://raw.githubusercontent.com/CihanTAYLAN/just-api-doc/refs/heads/main/screen-images/dashboard.png" alt="Empty Dashboard" />

### Create New API Documentation

<img src="https://raw.githubusercontent.com/CihanTAYLAN/just-api-doc/refs/heads/main/screen-images/create-new.png" alt="Create New API Documentation" />

### Dashboard with API Documentation

<img src="https://raw.githubusercontent.com/CihanTAYLAN/just-api-doc/refs/heads/main/screen-images/dashboard-2.png" alt="Dashboard with API Documentation" />

### API Documentation Page

<img src="https://raw.githubusercontent.com/CihanTAYLAN/just-api-doc/refs/heads/main/screen-images/api-doc.png" alt="API Documentation Page" />

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support & Community

- 📫 Author: Cihan TAYLAN
  - Website: [cihantaylan.com](https://cihantaylan.com)
  - GitHub: [@cihantaylan](https://github.com/cihantaylan)
  - LinkedIn: [cihantaylan](https://www.linkedin.com/in/cihantaylan/)

### Issue Reporting

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/cihanTAYLAN/grpc-boilerplate-realtime/issues) or reach out on [X](https://x.com/cihantaylan24).

---

<div align="center">
  <sub>Built with ❤️ by Cihan TAYLAN</sub>
  <br>
  ⭐ Don't forget to star this project if you found it helpful!
</div>
