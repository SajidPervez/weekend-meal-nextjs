import React from 'react';

interface EmailContentProps {
  body: string;
}

const EmailContent: React.FC<EmailContentProps> = ({ body }) => {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
};

export default EmailContent;
