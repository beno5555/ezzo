using System.ComponentModel.DataAnnotations;
using aspnetproject.Common.ProjectConstants;

namespace aspnetproject.Infrastructure.Dtos.Posts;

public class UpdatePostDto
{
    [MaxLength(Constants.PostTitleMaxLength)]
    [Required]
    public string Title { get; set; } = string.Empty;
    
    // Empty text is allowed here; PostService refuses it when the post has no photos.
    [MaxLength(Constants.PostContentMaxLength)]
    [Required(AllowEmptyStrings = true)]
    public string Content { get; set; } = string.Empty;
}