# SafeNest

PROJECT REQUIREMENT DOCUMENT

Project Name

SafeNest AI

The Intelligent Postpartum Safety Companion

Project Overview

Develop a modern, AI-powered healthcare web application called SafeNest AI, an intelligent postpartum safety companion designed specifically for new parents experiencing sleep deprivation, mental fatigue, emotional stress, and cognitive overload during the first year after childbirth. Unlike conventional baby-care or parenting applications that primarily focus on growth tracking and milestone recording, this platform is designed around one critical problem: helping exhausted parents make safer decisions while reducing the risk of mistakes caused by sleep deprivation.

The primary objective of this application is to provide real-time assistance through voice interaction, intelligent reminders, emotional wellbeing monitoring, emergency guidance, and simplified baby-care tracking. Every interaction within the application must be carefully designed to minimize cognitive effort. Users should be able to complete important actions using minimal thinking, minimal reading, and as few taps as possible. The interface should feel calm, supportive, trustworthy, and emotionally reassuring rather than technical or clinical.

The application should not replace medical professionals. Instead, it should act as a trusted digital companion that supports parents during stressful situations while always encouraging consultation with healthcare professionals whenever necessary.

Problem Statement

Research shows that new parents frequently experience severe sleep deprivation during the postpartum period. Lack of sleep significantly reduces attention span, memory, decision-making ability, and emotional stability. As a result, parents often forget feeding schedules, medication timings, diaper changes, sleep routines, hydration, and even important health symptoms that require medical attention. In addition, postpartum depression often goes unnoticed because many parents dismiss emotional changes as normal exhaustion.

Current parenting applications are designed for organized users who have the time and energy to navigate multiple menus, forms, charts, and settings. They assume users are alert and attentive. In reality, exhausted parents require an interface specifically designed for impaired decision-making. SafeNest AI addresses this gap by becoming a safety-first, voice-driven assistant that helps parents make informed decisions quickly while reducing mental workload.

Vision

The vision of SafeNest AI is to become an intelligent healthcare companion that actively supports both the baby and the parent. Rather than functioning as a passive tracking application, the system should continuously assist users by understanding voice commands, simplifying daily routines, identifying emotional distress, detecting emergencies, and providing calm guidance during stressful situations. The experience should resemble having a supportive healthcare assistant available twenty-four hours a day.

Target Users

The primary users include first-time parents, mothers recovering from childbirth, fathers sharing caregiving responsibilities, parents experiencing sleep deprivation, guardians caring for newborns, and families seeking an easy-to-use baby-care management system. The application should also provide optional access for partners or family members to receive wellbeing updates when necessary.

User Experience Philosophy

The entire application must be designed according to "Low Cognitive Load" principles. Every screen should reduce decision fatigue by presenting only the most essential information. Navigation should be extremely simple, buttons should be large enough for one-handed operation, text should be highly readable even during nighttime, and every important action should require no more than two taps.

Voice interaction should always be prioritized over typing wherever possible. All important responses should be spoken aloud while simultaneously displaying large on-screen text. The design should use soft colors, smooth animations, rounded components, and dark mode by default to reduce eye strain during late-night use. The overall experience should feel comforting and emotionally supportive instead of overwhelming.

Core Module 1 – AI Voice Medication Assistant

The AI Voice Medication Assistant will serve as the flagship feature of the application and should be prominently displayed on the home screen. Users should be able to ask questions naturally using voice without navigating complicated menus. For example, a parent may say, "My baby is four months old, weighs six kilograms, and has a fever. How much infant paracetamol should I give?" The system should intelligently extract the baby's age, weight, symptoms, and medication name from the spoken request.

Medication dosages must never be generated using artificial intelligence. Instead, the application should rely exclusively on validated pediatric dosage lookup tables created from trusted medical references. Artificial intelligence should only interpret user speech and convert it into structured information before consulting the dosage database.

Once the appropriate dosage is identified, the application should present the recommended amount in large, highly visible text while simultaneously reading the instructions aloud using natural speech synthesis. Additional safety guidance should always accompany every recommendation, reminding users that the information is intended as educational guidance and encouraging consultation with a pediatrician before administering medication.

If the user's voice input includes dangerous symptoms such as difficulty breathing, seizures, persistent vomiting, unconsciousness, blue lips, or fever in a newborn, the application must immediately stop all dosage calculations and instead activate Emergency Mode with clear instructions to seek immediate medical attention.

Core Module 2 – Baby Care Timeline

The Baby Care Timeline should simplify daily caregiving tasks through a single-tap interaction model. Instead of requiring detailed forms, the application should present three large action buttons labeled "Fed," "Slept," and "Diaper Changed." Selecting any of these buttons should instantly record the current timestamp without requiring additional user input.

The dashboard should continuously display how much time has passed since the baby's last feeding, sleep session, and diaper change. Information should be presented in a simple and readable format such as "Last Feeding: Two Hours Ago" or "Last Diaper Change: Forty Minutes Ago." Parents should also have access to a chronological timeline that visually summarizes the day's activities.

Core Module 3 – Intelligent Mood Monitoring

The wellbeing of the parent is equally important as the wellbeing of the baby. Therefore, the application should perform a gentle daily emotional check-in by asking simple questions such as "How are you feeling today?" Users should respond using large emoji buttons or voice input. Responses should be stored to identify emotional trends over time.

Rather than attempting to diagnose mental health conditions, the application should identify patterns that may suggest emotional distress using simplified postpartum depression screening principles inspired by clinically validated questionnaires. When the system detects consistently negative emotional trends over multiple days, it should gently encourage the user to seek additional support.

If enabled during onboarding, trusted family members or partners may receive supportive notifications encouraging them to check in on the parent. These notifications should always use compassionate language rather than alarming messages.

Core Module 4 – Intelligent Reminder System

Instead of traditional fixed reminders, the application should learn caregiving routines based on previous user behavior. For example, if the baby is usually fed every two hours, the application should gently notify the parent shortly before the expected feeding time. These reminders should be personalized, adaptive, and non-intrusive. Notification language should sound supportive rather than demanding.

Core Module 5 – Emergency Assistance

Emergency situations require immediate access to critical information. The application should provide a dedicated Emergency Mode that becomes accessible both manually and automatically when dangerous symptoms are detected. This mode should display emergency contact buttons, nearby hospitals, pediatrician contact information, baby's medical details, recent medication history, allergies, and recent health events. The interface should be intentionally simplified with oversized emergency buttons to minimize confusion during stressful moments.

Core Module 6 – AI Parenting Assistant

The application should include an intelligent conversational assistant capable of answering common parenting questions related to newborn care, feeding, sleep, development, teething, breastfeeding, vaccinations, and general childcare practices. Responses should be based only on trusted medical sources such as the World Health Organization (WHO), NHS, CDC, and the American Academy of Pediatrics. When uncertain, the assistant should clearly state that professional medical advice is required instead of generating speculative information.

User Interface Requirements

The application should follow a premium healthcare design language inspired by Apple Health and modern medical platforms. Rounded cards, soft shadows, clean typography, smooth animations, glassmorphism effects, and carefully selected calming colors should create a reassuring environment. Dark mode should be enabled by default to reduce eye strain during nighttime caregiving. The interface must be fully responsive for desktop, tablet, and mobile devices while maintaining consistent usability across all screen sizes.

Technical Requirements

The application should be developed using React, TypeScript, Tailwind CSS, Framer Motion, React Router, and ShadCN UI for the frontend. Voice recognition should utilize the Web Speech API, while speech synthesis should provide spoken responses. User authentication should support secure login with Google. Data storage may be implemented using Firebase or Supabase depending on project requirements. Artificial intelligence should be integrated only where it enhances user understanding, conversation, or emotional analysis. All medication dosage calculations must rely exclusively on validated lookup tables rather than AI-generated recommendations.

Innovation Highlights

SafeNest AI differentiates itself by combining healthcare safety, artificial intelligence, accessible design, and emotional wellbeing into a unified platform. Unlike conventional parenting applications, it is specifically engineered for users experiencing severe sleep deprivation. Every interaction prioritizes clarity, simplicity, and safety. The combination of voice-first interaction, validated medication guidance, adaptive reminders, postpartum emotional monitoring, emergency detection, and caregiver support creates a solution that addresses both the physical and psychological challenges of early parenthood.

Rather than simply tracking baby activities, SafeNest AI functions as an intelligent safety companion that actively assists families during one of the most demanding periods of their lives, making it a highly impactful, socially meaningful, and technically innovative solution suitable for healthcare innovation competitions and hackathons.

COMPLETE MASTER PROMPT FOR SafeNest CARE

Build a Premium AI Healthcare Web Application

Project Name

SafeNest AI

Your Intelligent Postpartum Safety Companion

Project Vision

Create a beautiful, premium AI-powered healthcare application designed specifically for sleep-deprived new parents.

This is NOT a baby tracker.

This is NOT a health app.

It is a safety system built around one of the world's most vulnerable situations:

Parents who are exhausted, emotionally overwhelmed, forgetful, and making life-critical decisions while sleep deprived.

Every interaction must reduce cognitive load.

Every screen must require almost zero thinking.

The interface should feel calm, supportive, and emotionally reassuring rather than clinical.

The entire product should feel like an AI caregiver quietly helping the parent survive the first months.

Design Philosophy

Follow these UX principles everywhere:

• Huge buttons (minimum 72px height)

• Giant readable typography

• High contrast

• Night mode by default

• Extremely minimal navigation

• Maximum two taps for every action

• Voice-first interactions

• Soft animations

• Rounded premium UI

• Calm colors

• Accessibility focused

The user should be able to operate the entire app half asleep with one hand.

Color Palette

Background:
#09090B

Cards:
#18181B

Primary:
#5B8DEF

Secondary:
#7DD3FC

Success:
#22C55E

Warning:
#FACC15

Emergency:
#EF4444

Text:
White

Accent:
Soft lavender

Typography

Use modern typography similar to Apple Health.

Large Titles

Bold Headings

Very large button labels

Minimal body text

Tech Stack

Frontend

React

TypeScript

TailwindCSS

Framer Motion

React Router

Shadcn UI

Lucide Icons

Speech Recognition:
Web Speech API

Text To Speech:
Speech Synthesis API

Backend

Firebase

or

Supabase

Authentication

Google Login

Apple Login (optional)

Database

Firestore

or

Supabase

AI

Claude API

or

OpenAI GPT

Use AI only where it adds intelligence.

Never use AI for medicine calculations.

Medicine dosage must always come from validated lookup tables.

Core Features

Build in this order.

1. AI Voice Medicine Assistant (Hero Feature)

This is the homepage hero.

Large microphone button.

Parent presses once.

Parent speaks:

"My baby is four months old."

"Weight six kilograms."

"Has fever."

"How much paracetamol?"

The AI extracts

Age

Weight

Medicine

Symptoms

Then uses a validated lookup table.

Never let AI invent dosage.

Example response

Voice

"For a six kilogram baby, the recommended infant paracetamol dose is two point five milliliters every four to six hours."

Large Card

Recommended Dose

2.5 ml

Medicine

Infant Paracetamol

Repeat

Every 4–6 hours

Maximum

4 doses in 24 hours

Safety Notice

This guidance is based on standard pediatric dosage references.
Always confirm with your pediatrician.

Emergency Detection

If user says

difficulty breathing

blue lips

newborn fever

seizure

loss of consciousness

blood vomiting

persistent vomiting

AI must immediately stop.

Show full screen.

RED

Emergency Detected

Please seek emergency medical attention immediately.

Call emergency services now.

No medicine advice.

2. One Tap Baby Timeline

Large cards

FED

SLEPT

DIAPER

Each tap logs

Time

Date

Duration (optional)

Homepage should show

Last Feed

2 hr 12 min ago

Last Sleep

1 hr ago

Last Diaper

45 min ago

Timeline view

Morning

Afternoon

Night

Simple visual timeline.

3. Smart Reminder Engine

Instead of fixed reminders

Use AI.

If baby usually feeds every

2 hours

Notify

"Baby usually feeds around this time."

Instead of

"Reminder"

Use

Gentle nudges.

Night mode notifications.

Minimal sound.

4. Mood Monitoring

Daily popup

How are you feeling today?

😊

😐

😔

Optional voice answer

AI analyses emotion.

Store trends.

Never diagnose.

Use adapted EPDS-inspired screening.

If mood is declining

Show

"You deserve support too."

Would you like to talk to someone?

5. Escalation System

Setup

Partner

Doctor

Emergency Contact

If

3+ consecutive low moods

or

Concerning phrases detected

Trigger

Support Alert

Send notification

"[Name] may need extra support today."

Never use alarming language.

Always compassionate.

6. AI Parent Assistant

Chat

Examples

"My baby won't sleep."

"When should I burp?"

"Can I breastfeed after taking medicine?"

"When do babies start teething?"

Responses

Evidence based

Friendly

Sources

WHO

AAP

NHS

Never hallucinate.

7. Night Mode Dashboard

Large clock

Feed countdown

Medicine countdown

Water reminder

Mood summary

Sleep tracker

No clutter.

8. AI Risk Detection

Detect phrases

"I forgot medicine"

"I feel hopeless"

"My baby isn't breathing"

"I'm scared"

"My baby hasn't eaten"

"Baby keeps vomiting"

Immediately classify

Low

Medium

High

Critical

Show proper action.

9. Emergency Mode

One tap

Emergency

Shows

Nearest hospital

Emergency numbers

Partner

Doctor

Current baby details

Medicine history

Recent symptoms

Huge buttons.

10. Family Dashboard

Partner login

See

Mood trend

Feed history

Sleep

Medicine

Alerts

Timeline

Live sync.

Additional WOW Features (Hackathon Winner)

AI Cry Analyzer (Prototype)

Upload or record baby crying.

AI predicts possible reason:

 Hungry

 Sleepy

 Gas

 Discomfort

Display confidence with a disclaimer that it is only an estimate.

Smart Camera Check

Use the webcam to estimate whether the baby appears awake or asleep (prototype only). Show that this is experimental.

Voice Commands

Examples:

 "Log feeding"

 "Start sleep timer"

 "Last diaper?"

 "Medicine reminder"

 "Emergency help"

Everything should work hands-free.

AI Timeline Summary

Each evening generate a simple summary:

 Feedings today

 Sleep duration

 Diaper count

 Medicine given

 Mood check

 Suggested reminders for tomorrow

Trusted Medical Knowledge

Use WHO, AAP, NHS, or other reputable pediatric guidance as references for educational content. Never fabricate medical advice or use AI-generated dosage calculations.

UI Style

Apple Health

Google Material 3

Calm animations

Rounded cards

Glassmorphism

Large spacing

Modern shadows

Professional healthcare aesthetics

Hackathon Demo Flow

 User opens SafeNest AI.

 Voice asks: "How can I help today?"

 Parent asks for paracetamol dosage.

 App responds instantly with validated dosage and a spoken explanation.

 Parent taps "Fed."

 Timeline updates automatically.

 Daily mood check records a low mood.

 After several low moods, the partner support alert is demonstrated.

 User says, "My baby has trouble breathing."

 App immediately switches to Emergency Mode with clear guidance.

Performance Requirements

 Mobile-first responsive design.

 Voice response under 2 seconds.

 Offline support for logging and dosage lookup.

 Secure authentication.

 Fast loading (<2 seconds).

 Smooth animations (60 FPS).

 Accessibility compliant.

 Simple onboarding in under 60 seconds.


make the project more good and enough hackathon winning concept

This project is SafeNest, a clinical-grade digital health companion for postpartum caregivers.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
