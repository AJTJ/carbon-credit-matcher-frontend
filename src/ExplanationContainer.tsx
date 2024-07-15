import React from "react";
import styled from "styled-components";

const ExplanationContainer = styled.div`
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
`;

const SectionContent = styled.p`
  margin-top: 10px;
`;

interface MatchExplanationProps {
  explanation: string;
}

const MatchExplanation: React.FC<MatchExplanationProps> = ({ explanation }) => {
  const sections = [
    { key: "a", title: "Industry and Focus Area Alignment" },
    { key: "b", title: "Emissions Reduction Impact" },
    { key: "c", title: "Project Type Compatibility" },
    { key: "d", title: "Environmental and Social Impact Relevance" },
    { key: "e", title: "Technology and Co-benefits Analysis" },
    { key: "f", title: "Overall Match Assessment" },
  ];

  const parseExplanation = (text: string) => {
    const parsedSections: { [key: string]: string } = {};
    sections.forEach((section, index) => {
      const startRegex = new RegExp(`${section.key}\\. ${section.title}:`);
      const endRegex =
        index < sections.length - 1
          ? new RegExp(
              `${sections[index + 1].key}\\. ${sections[index + 1].title}:`
            )
          : /$/;
      const match = text.match(
        new RegExp(`${startRegex.source}(.*?)${endRegex.source}`, "s")
      );
      if (match) {
        parsedSections[section.key] = match[1].trim();
      }
    });
    return parsedSections;
  };

  const parsedSections = parseExplanation(explanation);

  return (
    <ExplanationContainer>
      {sections.map((section) => (
        <Section key={section.key}>
          <SectionTitle>{section.title}</SectionTitle>
          <SectionContent>{parsedSections[section.key]}</SectionContent>
        </Section>
      ))}
    </ExplanationContainer>
  );
};

export default MatchExplanation;
