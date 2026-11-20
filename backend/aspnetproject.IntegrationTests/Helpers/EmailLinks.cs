using System.Net;
using System.Text.RegularExpressions;
using System.Web;

namespace aspnetproject.IntegrationTests.Helpers;

// Reads the one link in a recorded email (EmailRecorder), the way a mail client would follow it.
public static class EmailLinks
{
    private const string TokenParameter = "token";

    // The address of the email's one link, with its HTML escaping undone.
    public static Uri ReadLink(string emailBody)
    {
        var href = Regex.Match(emailBody, "href=\"([^\"]+)\"");
        Assert.True(href.Success, $"The email holds no link: {emailBody}");

        return new Uri(WebUtility.HtmlDecode(href.Groups[1].Value));
    }

    public static string? ReadToken(Uri link)
    {
        return ReadQueryValue(link, TokenParameter);
    }

    public static string? ReadQueryValue(Uri link, string name)
    {
        return HttpUtility.ParseQueryString(link.Query)[name];
    }
}
