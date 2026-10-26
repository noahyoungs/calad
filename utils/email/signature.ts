export const htmlSignature = `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 500; background-color: #7f8ee2; color: #ffffff; border-radius: 14px; padding: 12px 15px; width: fit-content; margin-top: 10px;">
  <tr>
    <td align="center" valign="middle" style="padding-right: 12px;">
      <a href="https://cal.ad" style="text-decoration: none; color: #ffffff">
        <img src="${process.env.NEXT_PUBLIC_APP_URL}/email/logo.png" width="80" height="22" alt="cal.ad" 
      </a>
    </td>

    <td style="border-left: 1px solid #ffffff; width: 1px; height: 40px; padding: 0 6px;"></td>

    <td valign="middle">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" style="padding-bottom: 2px;">
     <img src="${process.env.NEXT_PUBLIC_APP_URL}/email/your_calendar_assistant.png" width="144" height="10" alt="Your calendar assistant" 

          </td>
          <td valign="middle" style="padding-left: 4px;">
            <span style="font-size: 12px;">✨</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <a href="mailto:hello@cal.ad" style="color: #ffffff; text-decoration: none;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/email/email.png" width="92" height="18" alt="Email: hello@cal.ad" 
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p>30 N Gould St STE R, Sheridan WY 82801</p>
`;

// Plain text version of the signature for text emails
export const plainTextSignature = `

-- 
cal.ad
Your calendar Assistant ✨
📧 hello@cal.ad

⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡕⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢐⢕
⠀⠀⢀⢀⢀⠀⠀⠀⠀⠀⡀⡀⡀⠀⠀⠀⠀⡣⡃⠀⠀⠀⠀⠀⠀⠀⢀⢀⢀⠀⠀⠀⠀⠀⠀⡀⡀⡀⢐⢕
⠠⡸⡘⠘⠘⠜⠄⠀⢄⠇⠃⠃⠕⡕⢭⠀⠀⡇⠆⠀⠀⠀⠀⠀⢀⢜⠌⠊⠊⢎⢎⠅⠀⡄⡇⠃⠃⠣⡣⡱
⡣⡃⠀⠀⠀⠀⠀⠨⡪⠀⠀⠀⠀⢘⢜⠀⠀⡎⡅⠀⠀⠀⠀⠀⡢⡃⠀⠀⠀⠀⢕⠅⠨⡪⠀⠀⠀⠀⢑⢕
⢪⠢⡀⠀⠀⢀⠀⠨⡪⢄⠀⠀⠀⡔⡕⠀⠀⡇⠆⠀⠀⢀⢀⠀⠪⡢⡀⠀⠀⢠⢱⠁⠨⡪⡀⠀⠀⢀⢢⠃
⠀⠃⢇⢖⢜⠜⠈⠀⠘⠸⡰⡪⠪⢊⢎⠀⠀⠪⡱⠄⠀⠪⡪⠂⠀⠑⢎⢲⢸⠸⡨⠅⠀⠘⠜⢜⢔⠕⠑⠁

30 N Gould St STE R, Sheridan WY 82801
`;
