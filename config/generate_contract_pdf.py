from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet
import textwrap

output_file = "ProductionServicesAgreement.pdf"
c = canvas.Canvas(output_file, pagesize=A4)
width, height = A4
style = getSampleStyleSheet()['Normal']

# Contract Text (Truncated/Sample based on input)
contract_text = """
EX-10.7 12 dex107.htm PRODUCTION SERVICES AGREEMENT 

PRODUCTION SERVICES AGREEMENT

This MASTER PRODUCTION SERVICES AGREEMENT (this "Agreement") is made and entered into as of May 17, 2021 (the "Effective Date") by and between Amazon.com Services LLC, a Delaware limited liability company ("Amazon"), and the production company set forth in the Project Addendum (as defined below) ("ProdCo").

1.  SERVICES.
    ProdCo shall provide production services ("Services") to Amazon in connection with the audio-visual content (the "Project") described in a project addendum in the form attached hereto as Exhibit A (a "Project Addendum"). Each Project Addendum shall be governed by the terms and conditions of this Agreement. In the event of a conflict between the terms of a Project Addendum and this Agreement, the terms of the Project Addendum shall control.

2.  DELIVERABLES.
    ProdCo shall deliver to Amazon the materials described in the Project Addendum (the "Deliverables") in accordance with the delivery schedule set forth therein. ProdCo acknowledges that time is of the essence with respect to the delivery of the Deliverables.

3.  TERM.
    The term of this Agreement shall commence on the Effective Date and shall continue until the later of (a) the delivery of all Deliverables for all Projects and (b) the expiration of the Term of the last Project Addendum entered into hereunder, unless earlier terminated in accordance with the terms hereof.

4.  COMPENSATION.
    As full and complete consideration for ProdCo's performance of the Services and the rights granted herein, Amazon shall pay ProdCo the fees set forth in the applicable Project Addendum (the "Fee"). The Fee shall be payable in accordance with the payment schedule set forth in the Project Addendum.

5.  RIGHTS.
    (a) Work Made for Hire. ProdCo acknowledges and agrees that the Project and all Deliverables, including all elements thereof, shall be considered a "work made for hire" for Amazon within the meaning of the United States Copyright Act of 1976, as amended. Amazon shall be the sole and exclusive owner of all right, title and interest in and to the Project and the Deliverables throughout the universe in perpetuity.
    (b) Assignment. To the extent that the Project or any Deliverable does not qualify as a "work made for hire," ProdCo hereby irrevocably assigns, transfers and conveys to Amazon all right, title and interest in and to the Project and the Deliverables, including all copyrights, trademarks, patents, trade secrets and other intellectual property rights therein.

6.  REPRESENTATIONS AND WARRANTIES.
    ProdCo represents and warrants to Amazon that:
    (a) ProdCo has the full right, power and authority to enter into this Agreement and to perform its obligations hereunder;
    (b) The Project and the Deliverables shall be original to ProdCo (except for material provided by Amazon) and shall not infringe upon or violate the rights of any third party;
    (c) ProdCo shall comply with all applicable laws, rules and regulations in the performance of the Services.

7.  INDEMNIFICATION.
    ProdCo shall indemnify, defend and hold harmless Amazon and its affiliates, and their respective officers, directors, employees and agents, from and against any and all claims, damages, liabilities, costs and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) ProdCo's breach of any representation, warranty or covenant contained in this Agreement; (b) ProdCo's negligence or willful misconduct; or (c) any claim that the Project or any Deliverable infringes upon or violates the rights of any third party.

8.  TERMINATION.
    Amazon may terminate this Agreement or any Project Addendum at any time, with or without cause, upon written notice to ProdCo. In the event of such termination, Amazon shall pay ProdCo for all Services performed and Deliverables delivered through the date of termination.

9.  CONFIDENTIALITY.
    ProdCo shall keep confidential all information provided by Amazon in connection with this Agreement ("Confidential Information") and shall not disclose such Confidential Information to any third party without Amazon's prior written consent, except as required by law.

10. MISCELLANEOUS.
    (a) Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of laws principles.
    (b) Entire Agreement. This Agreement, together with all Project Addenda, constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements and understandings, whether written or oral.
    (c) Amendment. This Agreement may be amended only by a written instrument signed by both parties.
"""

textobject = c.beginText()
textobject.setTextOrigin(1*inch, 10.5*inch)
textobject.setFont("Helvetica", 10)

lines = contract_text.split('\n')
for line in lines:
    wrapped_lines = textwrap.wrap(line, width=90) # Adjust logic
    for wrapped_line in wrapped_lines:
        textobject.textLine(wrapped_line)
    if not wrapped_lines:
        textobject.textLine("")

c.drawText(textobject)
c.save()
print(f"Created {output_file}")
