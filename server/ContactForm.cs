using System.Net.Mail;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;

record ContactFormRequest(string? Name, string? Email, string? Message, string? Website);

static class ContactFormEndpoint
{
    public const string RateLimitPolicy = "contact-form";

    public static void MapContactFormEndpoint(this WebApplication app)
    {
        app.MapPost("/api/contact", async (
            ContactFormRequest request,
            HttpContext context,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            // Honeypot: real visitors never fill this hidden field. Pretend success so bots don't learn it's a trap.
            if (!string.IsNullOrWhiteSpace(request.Website))
            {
                return Results.Ok(new { success = true });
            }

            var errors = ValidateRequest(request);
            if (errors.Count > 0)
            {
                return Results.BadRequest(new { success = false, errors });
            }

            // Resolved lazily (not as a delegate parameter) so honeypot/validation short-circuits above
            // don't pay the cost of constructing the SES client and resolving AWS credentials.
            var ses = context.RequestServices.GetRequiredService<IAmazonSimpleEmailServiceV2>();

            return await SendAsync(
                request,
                ses,
                config["ContactForm:RecipientEmail"]!,
                config["ContactForm:SenderEmail"]!,
                logger);
        })
        .WithName("PostContactForm")
        .RequireRateLimiting(RateLimitPolicy);
    }

    internal static SendEmailRequest BuildEmailRequest(ContactFormRequest request, string recipientEmail, string senderEmail)
    {
        return new SendEmailRequest
        {
            FromEmailAddress = senderEmail,
            Destination = new Destination { ToAddresses = [recipientEmail] },
            ReplyToAddresses = [request.Email!],
            Content = new EmailContent
            {
                Simple = new Message
                {
                    Subject = new Content { Data = $"Portfolio contact form: {request.Name}" },
                    Body = new Body
                    {
                        Text = new Content { Data = $"From: {request.Name} <{request.Email}>\n\n{request.Message}" }
                    }
                }
            }
        };
    }

    internal static async Task<IResult> SendAsync(
        ContactFormRequest request,
        IAmazonSimpleEmailServiceV2 ses,
        string recipientEmail,
        string senderEmail,
        ILogger logger)
    {
        var sendRequest = BuildEmailRequest(request, recipientEmail, senderEmail);

        SendEmailResponse response;
        try
        {
            response = await ses.SendEmailAsync(sendRequest);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send contact-form email via SES");
            return Results.Problem("Failed to send message. Please try again later.", statusCode: 502);
        }

        logger.LogInformation("Contact-form email sent via SES, MessageId={MessageId}", response.MessageId);
        return Results.Ok(new { success = true });
    }

    internal static List<string> ValidateRequest(ContactFormRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 200 || request.Name.Any(c => c is '\r' or '\n'))
        {
            errors.Add("Name is required and must be 200 characters or fewer.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 320 || request.Email.Any(c => c is '\r' or '\n') || !MailAddress.TryCreate(request.Email, out _))
        {
            errors.Add("A valid email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 5000)
        {
            errors.Add("Message is required and must be 5000 characters or fewer.");
        }

        return errors;
    }
}
