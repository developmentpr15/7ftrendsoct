package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	appcfg "github.com/7ftrends/api/internal/config"
	"github.com/sirupsen/logrus"

	"github.com/aws/aws-sdk-go-v2/aws"
	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type UploadService struct {
	bucket        string
	publicBaseURL string
	s3Client      *s3.Client
	presignClient *s3.PresignClient
	logger        *logrus.Logger
}

func NewUploadService(storageCfg appcfg.StorageConfig, logger *logrus.Logger) *UploadService {
	ctx := context.Background()

	awsCfg, err := awscfg.LoadDefaultConfig(
		ctx,
		awscfg.WithRegion(storageCfg.Region),
		awscfg.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(storageCfg.AccessKeyID, storageCfg.SecretAccessKey, ""),
		),
	)
	if err != nil {
		logger.WithError(err).Fatal("failed to load AWS config for R2")
	}

	if storageCfg.Endpoint != "" {
		resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
			if service == s3.ServiceID {
				return aws.Endpoint{
					URL:               storageCfg.Endpoint,
					HostnameImmutable: true,
				}, nil
			}
			return aws.Endpoint{}, &aws.EndpointNotFoundError{}
		})
		awsCfg.EndpointResolverWithOptions = resolver
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = storageCfg.UsePathStyle
	})

	return &UploadService{
		bucket:        storageCfg.BucketName,
		publicBaseURL: strings.TrimRight(storageCfg.PublicBaseURL, "/"),
		s3Client:      s3Client,
		presignClient: s3.NewPresignClient(s3Client, func(po *s3.PresignOptions) {
			po.Expires = 5 * time.Minute
		}),
		logger:        logger,
	}
}

func (u *UploadService) GetPresignedPutURL(ctx context.Context, key, contentType string, expires time.Duration) (string, error) {
	if expires <= 0 {
		expires = 5 * time.Minute
	}
	input := &s3.PutObjectInput{
		Bucket:      &u.bucket,
		Key:         &key,
		ContentType: aws.String(contentType),
		ACL:         types.ObjectCannedACLPrivate,
	}
	res, err := u.presignClient.PresignPutObject(ctx, input, func(po *s3.PresignOptions) {
		po.Expires = expires
	})
	if err != nil {
		u.logger.WithError(err).Error("failed to create presigned PUT URL")
		return "", err
	}
	return res.URL, nil
}

func (u *UploadService) DeleteFile(ctx context.Context, key string) error {
	_, err := u.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &u.bucket,
		Key:    &key,
	})
	if err != nil {
		u.logger.WithError(err).Error("failed to delete object from R2")
		return err
	}
	return nil
}

func (u *UploadService) PublicURL(key string) string {
	key = strings.TrimLeft(key, "/")
	if u.publicBaseURL == "" {
		return key
	}
	return fmt.Sprintf("%s/%s", u.publicBaseURL, key)
}

// Optional: simple helper for multipart uploads in future
func (u *UploadService) Uploader() *manager.Uploader {
	return manager.NewUploader(u.s3Client)
}
