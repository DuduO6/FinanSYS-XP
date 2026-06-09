from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'email', 'username']
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    confirmPassword = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        normalized_email = value.lower()

        if User.objects.filter(email=normalized_email).exists():
            raise serializers.ValidationError('Este e-mail ja esta cadastrado.')

        return normalized_email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirmPassword']:
            raise serializers.ValidationError({'confirmPassword': 'As senhas precisam ser iguais.'})

        return attrs

    def create(self, validated_data):
        name = validated_data.get('name', '').strip()
        email = validated_data['email']

        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data['password'],
            first_name=name,
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower()
        password = attrs['password']
        user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError('E-mail ou senha invalidos.')

        attrs['user'] = user
        return attrs
