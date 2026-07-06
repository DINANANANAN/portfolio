import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import CaseStudySection from "@/components/CaseStudySection";
import ExperienceSection from "@/components/ExperienceSection";
import BusinessSection from "@/components/BusinessSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <>
      <Hero />
      <AboutSection />
      <SkillsSection />
      <ProjectsSection />
      <CaseStudySection />
      <ExperienceSection />
      <BusinessSection />
      <ContactSection />
    </>
  );
}
