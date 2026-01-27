# Meige Tracker - Development Summary

## Overview
Meige Tracker is a web application designed to help patients with Meige Syndrome track their daily symptoms, medications, Botox treatments, and medical appointments. The data is stored securely online and can be accessed from any device.

**Live App:** https://meige-tracker.vercel.app

---

## Tasks Completed

| Task | Objective | Simple Explanation |
|------|-----------|---------------------|
| Initial app creation | Build a React application to track Meige Syndrome symptoms | Created the base of the app that runs in a web browser |
| Calendar system | Allow month navigation and date selection | A calendar where you click on days to record how you feel |
| Daily symptom tracking | Sliders to record Blepharospasm and Oromandibular Dystonia severity | Easy sliders (0-10) to say how bad your eye and jaw symptoms were |
| Sleep tracking | Bed time and wake time with automatic calculation | Enter when you went to bed and woke up, app calculates sleep hours |
| Medication management | System to record medications with schedules | Track which medicines you took and when |
| Botox registration | Form to record injections with site grouping | Record when you got Botox and where (which muscles) |
| Appointments registration | System to schedule medical appointments | Keep track of doctor visits |
| Analysis charts | 5 correlation charts with clinical terms | Graphs that show your symptoms over time for your doctor |
| Supabase integration | Migrate from localStorage to cloud database | Your data is now saved online, so it doesn't get lost |
| Vercel deployment | Automatic deployment from GitHub | The app is available online for anyone to use |
| Clinical terminology | Update labels with proper medical terms | Changed "Face" to correct medical term "Jaw/Oromandibular Dystonia" |
| Botox groups | Group injection sites by clinical area | Organized Botox muscles into categories (Eyes, Jaw, Neck) |
| 24h time format | Replace AM/PM with 0h-23h | Time shows as "14h" instead of "2 PM" - easier to understand |
| Botox duration in months | Show time as "2m 15d" | Instead of "75 days", now shows "2 months and 15 days" |
| Delete records button | Allow deleting entries | You can remove entries you don't want anymore |
| Edit functionality | Edit buttons for records | Change existing records without deleting and starting over |
| Confirmation messages | Alerts for operations | App tells you when something worked or if there was a problem |

---

## Dependencies (Code Libraries)

| Package | Version | Purpose | Simple Explanation |
|---------|---------|---------|---------------------|
| react | 19.2.0 | UI framework | The engine that makes the screens work |
| react-dom | 19.2.0 | React DOM rendering | Connects React to the web browser |
| @supabase/supabase-js | 2.91.1 | Database client | Connects the app to the online database |
| recharts | 3.7.0 | Chart library | Creates the graphs and charts |
| tailwindcss | 4.1.18 | CSS framework | Makes the app look nice and modern |
| vite | 7.2.4 | Build tool | Compiles the code so it runs fast |

---

## External Services

| Service | Purpose | Simple Explanation |
|---------|---------|---------------------|
| Supabase | Database hosting | Where all your health data is stored online |
| Vercel | Web hosting | Makes the app available on the internet |
| GitHub | Code storage | Where the app's code is saved and backed up |

---

## How to Use

1. **Open the app** at https://meige-tracker.vercel.app
2. **Click on a day** in the calendar to record symptoms
3. **Use the sliders** to rate how severe symptoms were (0 = none, 10 = worst)
4. **Record medications** taken and when
5. **View the report** to see charts and data for your doctor

---

*Document created: January 27, 2026*
