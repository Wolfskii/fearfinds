// LandingPage.tsx
import Hero from '../components/Hero'

export default function LandingPage() {
  const heroContent = {
    imageSrc: '/assets/images/hero-example.jpeg' // Adjust the path based on your setup
  }

  return <Hero type='image' content={heroContent} heading='Your Heading' subheading='Your Subheading' />
}
