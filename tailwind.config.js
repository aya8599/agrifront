/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js" // تأكد من تضمين مكتبة Flowbite هنا
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin') // تأكد من تضمين Flowbite كإضافة
  ],
};
